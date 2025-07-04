// campaignManager.js
class CampaignManager {
    constructor() {
        this.currentCampaign = null;
        this.currentLevelIndex = 0;
        this.campaignProgress = this.loadProgress();
    }

    // Get available campaigns from the campaigns directory
    async getAvailableCampaigns() {
        try {
            // In a real implementation, this would read from the file system
            // For now, returning mock data - replace with actual directory reading
            return [
                { name: 'Fun', levels: 30, completed: this.getCompletedLevels('Fun') },
                { name: 'Tricky', levels: 30, completed: this.getCompletedLevels('Tricky') },
                { name: 'Taxing', levels: 30, completed: this.getCompletedLevels('Taxing') },
                { name: 'Mayhem', levels: 30, completed: this.getCompletedLevels('Mayhem') }
            ];
        } catch (error) {
            console.error('Error loading campaigns:', error);
            return [];
        }
    }

    // Load campaign levels
    async loadCampaign(campaignName) {
        try {
            this.currentCampaign = campaignName;
            this.currentLevelIndex = this.getLastPlayedLevel(campaignName);
            
            // In real implementation, this would load level files from campaigns/[campaignName]/
            const levels = await this.loadLevelsFromDirectory(`campaigns/${campaignName}`);
            return levels;
        } catch (error) {
            console.error('Error loading campaign:', error);
            return null;
        }
    }

    // Load specific level from campaign
    async loadLevel(levelIndex) {
        if (!this.currentCampaign) {
            throw new Error('No campaign selected');
        }

        try {
            const levelPath = `campaigns/${this.currentCampaign}/level_${levelIndex + 1}.json`;
            // In real implementation, load the actual level file
            const levelData = await this.loadLevelFile(levelPath);
            return levelData;
        } catch (error) {
            console.error('Error loading level:', error);
            return null;
        }
    }

    // Progress to next level
    progressToNextLevel() {
        this.currentLevelIndex++;
        this.saveProgress();
        return this.currentLevelIndex;
    }

    // Check if campaign is complete
    isCampaignComplete() {
        const totalLevels = this.getTotalLevels(this.currentCampaign);
        return this.currentLevelIndex >= totalLevels - 1;
    }

    // Save/Load progress (using localStorage for web implementation)
    saveProgress() {
        const progress = this.campaignProgress || {};
        if (!progress[this.currentCampaign]) {
            progress[this.currentCampaign] = {};
        }
        progress[this.currentCampaign].lastPlayed = this.currentLevelIndex;
        progress[this.currentCampaign].completed = progress[this.currentCampaign].completed || [];
        
        if (!progress[this.currentCampaign].completed.includes(this.currentLevelIndex)) {
            progress[this.currentCampaign].completed.push(this.currentLevelIndex);
        }

        localStorage.setItem('lemmingsCampaignProgress', JSON.stringify(progress));
        this.campaignProgress = progress;
    }

    loadProgress() {
        try {
            const saved = localStorage.getItem('lemmingsCampaignProgress');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Error loading progress:', error);
            return {};
        }
    }

    getCompletedLevels(campaignName) {
        return this.campaignProgress[campaignName]?.completed?.length || 0;
    }

    getLastPlayedLevel(campaignName) {
        return this.campaignProgress[campaignName]?.lastPlayed || 0;
    }

    getTotalLevels(campaignName) {
        // This would be determined by actual file count in the directory
        return 30; // Placeholder
    }

    // Placeholder for actual file loading - implement based on your environment
    async loadLevelsFromDirectory(path) {
        // Implementation depends on environment (Node.js, Electron, etc.)
        console.log(`Loading levels from ${path}`);
        return [];
    }

    async loadLevelFile(path) {
        // Implementation depends on environment
        console.log(`Loading level file: ${path}`);
        return {};
    }
}

export default CampaignManager;