#!/usr/bin/env node

/**
 * S3 Deployment Script for Lemmings Game
 * 
 * Features:
 * - Minifies JavaScript and CSS files
 * - Compresses assets
 * - Uploads to S3 with appropriate content types
 * - Sets cache headers for optimal performance
 * - Creates CloudFront invalidation (optional)
 * 
 * Usage: node deploy.js [--dry-run] [--no-minify] [--bucket bucket-name]
 */

// Load environment variables from .env file
require('dotenv').config();

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// AWS SDK v3
const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');

// Minification libraries
const terser = require('terser');
const CleanCSS = require('clean-css');
const htmlMinifier = require('html-minifier-terser');

class S3Deployer {
    constructor(config = {}) {
        this.config = {
            bucket: config.bucket || process.env.S3_BUCKET,
            region: config.region || process.env.AWS_REGION || 'us-east-1',
            cloudFrontDistributionId: config.cloudFrontDistributionId || process.env.CLOUDFRONT_DISTRIBUTION_ID,
            profile: config.profile || process.env.AWS_PROFILE,
            dryRun: config.dryRun || false,
            minify: config.minify !== false,
            verbose: config.verbose || false,
            ...config
        };

        // Initialize AWS clients
        const clientConfig = {
            region: this.config.region
        };
        
        if (this.config.profile) {
            // AWS SDK v3 automatically uses profile from credentials file
            process.env.AWS_PROFILE = this.config.profile;
        }

        this.s3Client = new S3Client(clientConfig);
        this.cloudFrontClient = new CloudFrontClient(clientConfig);

        // File type configurations
        this.fileTypes = {
            '.html': { contentType: 'text/html', minify: true, gzip: true },
            '.css': { contentType: 'text/css', minify: true, gzip: true },
            '.js': { contentType: 'application/javascript', minify: true, gzip: true },
            '.json': { contentType: 'application/json', minify: false, gzip: true },
            '.png': { contentType: 'image/png', minify: false, gzip: false },
            '.jpg': { contentType: 'image/jpeg', minify: false, gzip: false },
            '.jpeg': { contentType: 'image/jpeg', minify: false, gzip: false },
            '.gif': { contentType: 'image/gif', minify: false, gzip: false },
            '.webp': { contentType: 'image/webp', minify: false, gzip: false },
            '.mp3': { contentType: 'audio/mpeg', minify: false, gzip: false },
            '.ogg': { contentType: 'audio/ogg', minify: false, gzip: false },
            '.wav': { contentType: 'audio/wav', minify: false, gzip: false },
            '.txt': { contentType: 'text/plain', minify: false, gzip: true }
        };

        // Cache control settings
        this.cacheControl = {
            html: 'public, max-age=300', // 5 minutes for HTML
            css: 'public, max-age=31536000', // 1 year for CSS
            js: 'public, max-age=31536000', // 1 year for JS
            images: 'public, max-age=31536000', // 1 year for images
            audio: 'public, max-age=31536000', // 1 year for audio
            default: 'public, max-age=86400' // 1 day default
        };

        this.stats = {
            filesProcessed: 0,
            totalSize: 0,
            compressedSize: 0,
            startTime: Date.now()
        };
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async validateConfig() {
        if (!this.config.bucket) {
            throw new Error('S3 bucket name is required. Set S3_BUCKET environment variable or use --bucket flag.');
        }

        this.log(`Deployment Configuration:
🪣 Bucket: ${this.config.bucket}
🌍 Region: ${this.config.region}
🗜️  Minification: ${this.config.minify ? 'enabled' : 'disabled'}
🏃 Dry run: ${this.config.dryRun ? 'yes' : 'no'}
${this.config.cloudFrontDistributionId ? `☁️ CloudFront: ${this.config.cloudFrontDistributionId}` : ''}`);
    }

    async getAllFiles(dir, basePath = '') {
        const files = [];
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.join(basePath, entry.name);

            if (entry.isDirectory()) {
                // Skip directories that shouldn't be deployed
                const skipDirs = [
                    'music',
                    'assets/music',
                    'node_modules', 
                    '.git', 
                    '.github',
                    'dist', 
                    'build', 
                    '.aws-sam',
                    '.vscode',
                    '.idea',
                    'coverage',
                    'logs',
                    'tmp',
                    'temp'
                ];
                
                if (skipDirs.includes(entry.name)) {
                    if (this.config.verbose) {
                        this.log(`⏭️  Skipping directory: ${relativePath}`);
                    }
                    continue;
                }
                files.push(...await this.getAllFiles(fullPath, relativePath));
            } else {
                // Skip files that shouldn't be deployed
                const skipFiles = [
                    'package.json',
                    'package-lock.json',
                    'yarn.lock',
                    'deploy.js',
                    '.env',
                    '.env.local',
                    '.env.example',
                    '.gitignore',
                    '.gitattributes',
                    'README.md',
                    'CHANGELOG.md',
                    'LICENSE',
                    'Dockerfile',
                    'docker-compose.yml',
                    '.dockerignore',
                    '.eslintrc',
                    '.eslintrc.js',
                    '.eslintrc.json',
                    'tsconfig.json',
                    'webpack.config.js',
                    'rollup.config.js',
                    'vite.config.js',
                    '.DS_Store',
                    'Thumbs.db',
                    'bucket-policy.json'
                ];

                // Skip files by name
                if (skipFiles.includes(entry.name)) {
                    if (this.config.verbose) {
                        this.log(`⏭️  Skipping file: ${relativePath}`);
                    }
                    continue;
                }

                // Skip files by extension
                const skipExtensions = [
                    '.log',
                    '.tmp',
                    '.bak',
                    '.swp',
                    '.lock'
                ];

                const ext = path.extname(entry.name).toLowerCase();
                if (skipExtensions.includes(ext)) {
                    if (this.config.verbose) {
                        this.log(`⏭️  Skipping file by extension: ${relativePath}`);
                    }
                    continue;
                }

                // Skip hidden files (except specific ones we want)
                const allowedHiddenFiles = ['.htaccess'];
                if (entry.name.startsWith('.') && !allowedHiddenFiles.includes(entry.name)) {
                    if (this.config.verbose) {
                        this.log(`⏭️  Skipping hidden file: ${relativePath}`);
                    }
                    continue;
                }

                files.push({
                    localPath: fullPath,
                    s3Key: relativePath.replace(/\\/g, '/') // Ensure forward slashes for S3
                });
            }
        }

        return files;
    }

    async minifyContent(content, filePath) {
        const ext = path.extname(filePath).toLowerCase();
        
        try {
            switch (ext) {
                case '.js':
                    const jsResult = await terser.minify(content, {
                        compress: {
                            drop_console: true,
                            drop_debugger: true,
                            pure_funcs: ['console.log', 'console.debug', 'console.info']
                        },
                        mangle: true,
                        format: {
                            comments: false
                        }
                    });
                    
                    if (jsResult.error) {
                        this.log(`Minification error for ${filePath}: ${jsResult.error}`, 'warn');
                        return content;
                    }
                    return jsResult.code;

                case '.css':
                    const cleanCSS = new CleanCSS({
                        level: 2,
                        returnPromise: true
                    });
                    const cssResult = await cleanCSS.minify(content);
                    return cssResult.styles;

                case '.html':
                    return await htmlMinifier.minify(content, {
                        removeComments: true,
                        removeRedundantAttributes: true,
                        removeScriptTypeAttributes: true,
                        removeStyleLinkTypeAttributes: true,
                        useShortDoctype: true,
                        collapseWhitespace: true,
                        conservativeCollapse: true,
                        minifyCSS: true,
                        minifyJS: true
                    });

                default:
                    return content;
            }
        } catch (error) {
            this.log(`Minification failed for ${filePath}: ${error.message}`, 'warn');
            return content;
        }
    }

    getCacheControl(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        
        if (ext === '.html') return this.cacheControl.html;
        if (['.css'].includes(ext)) return this.cacheControl.css;
        if (['.js'].includes(ext)) return this.cacheControl.js;
        if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) return this.cacheControl.images;
        if (['.mp3', '.ogg', '.wav'].includes(ext)) return this.cacheControl.audio;
        
        return this.cacheControl.default;
    }

    async processFile(file) {
        const { localPath, s3Key } = file;
        const ext = path.extname(localPath).toLowerCase();
        const fileConfig = this.fileTypes[ext] || { contentType: 'application/octet-stream', minify: false, gzip: false };

        let content = await fs.readFile(localPath);
        const originalSize = content.length;
        let processedContent = content;

        // Minify if enabled and supported
        if (this.config.minify && fileConfig.minify) {
            const textContent = content.toString('utf8');
            const minified = await this.minifyContent(textContent, localPath);
            processedContent = Buffer.from(minified, 'utf8');
        }

        // Calculate file hash for ETag
        const hash = crypto.createHash('md5').update(processedContent).digest('hex');

        const uploadParams = {
            Bucket: this.config.bucket,
            Key: s3Key,
            Body: processedContent,
            ContentType: fileConfig.contentType,
            CacheControl: this.getCacheControl(localPath),
            Metadata: {
                'original-size': originalSize.toString(),
                'processed-size': processedContent.length.toString(),
                'build-time': new Date().toISOString()
            }
        };

        // Add content encoding for gzipped files
        if (fileConfig.gzip && processedContent.length > 1024) {
            const zlib = require('zlib');
            const gzipped = zlib.gzipSync(processedContent);
            if (gzipped.length < processedContent.length) {
                uploadParams.Body = gzipped;
                uploadParams.ContentEncoding = 'gzip';
                processedContent = gzipped;
            }
        }

        this.stats.filesProcessed++;
        this.stats.totalSize += originalSize;
        this.stats.compressedSize += processedContent.length;

        const savings = originalSize > 0 ? ((originalSize - processedContent.length) / originalSize * 100).toFixed(1) : '0';
        
        if (this.config.verbose) {
            this.log(`📁 ${s3Key} (${this.formatBytes(originalSize)} → ${this.formatBytes(processedContent.length)}, ${savings}% saved)`);
        }

        if (!this.config.dryRun) {
            await this.s3Client.send(new PutObjectCommand(uploadParams));
        }

        return {
            key: s3Key,
            originalSize,
            compressedSize: processedContent.length,
            savings: parseFloat(savings)
        };
    }

    async deploy() {
        try {
            await this.validateConfig();
            
            this.log('🚀 Starting deployment...');
            
            // Get all files to upload
            const files = await this.getAllFiles('.');
            this.log(`Found ${files.length} files to process`);

            // Process files in parallel (but limit concurrency)
            const concurrency = 5;
            const results = [];
            
            for (let i = 0; i < files.length; i += concurrency) {
                const batch = files.slice(i, i + concurrency);
                const batchPromises = batch.map(file => this.processFile(file));
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
                
                this.log(`Processed ${Math.min(i + concurrency, files.length)}/${files.length} files`);
            }

            // Print deployment summary
            this.printSummary(results);

            // Create CloudFront invalidation if configured
            if (this.config.cloudFrontDistributionId && !this.config.dryRun) {
                await this.invalidateCloudFront();
            }

            this.log('🎉 Deployment completed successfully!', 'success');
            
        } catch (error) {
            this.log(`Deployment failed: ${error.message}`, 'error');
            process.exit(1);
        }
    }

    async invalidateCloudFront() {
        try {
            this.log('☁️ Creating CloudFront invalidation...');
            
            const params = {
                DistributionId: this.config.cloudFrontDistributionId,
                InvalidationBatch: {
                    Paths: {
                        Quantity: 1,
                        Items: ['/*']
                    },
                    CallerReference: Date.now().toString()
                }
            };

            const result = await this.cloudFrontClient.send(new CreateInvalidationCommand(params));
            this.log(`CloudFront invalidation created: ${result.Invalidation.Id}`, 'success');
            
        } catch (error) {
            this.log(`CloudFront invalidation failed: ${error.message}`, 'warn');
        }
    }

    printSummary(results) {
        const totalOriginal = this.stats.totalSize;
        const totalCompressed = this.stats.compressedSize;
        const totalSavings = totalOriginal > 0 ? ((totalOriginal - totalCompressed) / totalOriginal * 100).toFixed(1) : '0';
        const duration = ((Date.now() - this.stats.startTime) / 1000).toFixed(1);

        this.log(`
📊 Deployment Summary:
   Files processed: ${this.stats.filesProcessed}
   Original size: ${this.formatBytes(totalOriginal)}
   Compressed size: ${this.formatBytes(totalCompressed)}
   Total savings: ${totalSavings}%
   Duration: ${duration}s
   
🏆 Top space savers:`);

        // Show top 5 files with biggest savings
        const topSavers = results
            .filter(r => r.savings > 0)
            .sort((a, b) => (b.originalSize - b.compressedSize) - (a.originalSize - a.compressedSize))
            .slice(0, 5);

        topSavers.forEach(file => {
            const saved = this.formatBytes(file.originalSize - file.compressedSize);
            this.log(`   ${file.key}: ${saved} (${file.savings}%)`);
        });

        if (this.config.dryRun) {
            this.log('🔍 This was a dry run - no files were actually uploaded', 'warn');
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// CLI Interface
function parseArgs() {
    const args = process.argv.slice(2);
    const config = {};
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--dry-run') {
            config.dryRun = true;
        } else if (arg === '--no-minify') {
            config.minify = false;
        } else if (arg === '--verbose' || arg === '-v') {
            config.verbose = true;
        } else if (arg === '--bucket') {
            config.bucket = args[++i];
        } else if (arg === '--region') {
            config.region = args[++i];
        } else if (arg === '--profile') {
            config.profile = args[++i];
        } else if (arg === '--cloudfront') {
            config.cloudFrontDistributionId = args[++i];
        } else if (arg === '--help' || arg === '-h') {
            console.log(`
Lemmings Game S3 Deployment Script

Usage: node deploy.js [options]

Options:
  --bucket <name>        S3 bucket name (or set S3_BUCKET env var)
  --region <region>      AWS region (default: us-east-1)
  --profile <profile>    AWS profile to use
  --cloudfront <id>      CloudFront distribution ID for invalidation
  --dry-run             Show what would be uploaded without actually doing it
  --no-minify           Skip minification
  --verbose, -v         Verbose output
  --help, -h            Show this help

Environment Variables:
  S3_BUCKET                    S3 bucket name
  AWS_REGION                   AWS region
  AWS_PROFILE                  AWS profile
  CLOUDFRONT_DISTRIBUTION_ID   CloudFront distribution ID

Examples:
  node deploy.js --bucket my-lemmings-bucket --dry-run
  node deploy.js --bucket my-bucket --cloudfront E1234567890 --verbose
  AWS_PROFILE=production node deploy.js --bucket production-bucket
            `);
            process.exit(0);
        }
    }
    
    return config;
}

// Main execution
async function main() {
    try {
        const config = parseArgs();
        const deployer = new S3Deployer(config);
        await deployer.deploy();
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = S3Deployer;