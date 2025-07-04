// campaignUI.js
class CampaignUI {
    constructor(gameInstance, campaignManager) {
        this.game = gameInstance;
        this.campaignManager = campaignManager;
        this.container = null;
    }

    // Create campaign selection screen
    createCampaignSelectScreen() {
        // Create container if it doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'campaignSelectScreen';
            this.container.className = 'screen';
            this.container.style.cssText = `
                display: none;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #1a1a2e;
                color: white;
                font-family: Arial, sans-serif;
            `;
        }

        this.container.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h1 style="font-size: 36px; margin-bottom: 30px;">Select Campaign</h1>
                <div id="campaignList" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                "></div>
                <button onclick="campaignUI.backToMenu()" style="
                    margin-top: 40px;
                    padding: 15px 30px;
                    font-size: 18px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">Back to Menu</button>
            </div>
        `;

        return this.container;
    }

    // Show campaign selection
    async showCampaignSelect() {
        const campaigns = await this.campaignManager.getAvailableCampaigns();
        const listContainer = document.getElementById('campaignList');
        
        listContainer.innerHTML = '';
        
        campaigns.forEach(campaign => {
            const campaignCard = this.createCampaignCard(campaign);
            listContainer.appendChild(campaignCard);
        });

        this.container.style.display = 'block';
    }

    // Create individual campaign card
    createCampaignCard(campaign) {
        const card = document.createElement('div');
        card.style.cssText = `
            background: #2a2a3e;
            border-radius: 10px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s;
            border: 2px solid transparent;
        `;

        card.innerHTML = `
            <h3 style="font-size: 24px; margin-bottom: 10px;">${campaign.name}</h3>
            <p style="color: #888; margin-bottom: 15px;">
                ${campaign.completed}/${campaign.levels} levels completed
            </p>
            <div style="
                background: #444;
                border-radius: 5px;
                height: 10px;
                overflow: hidden;
            ">
                <div style="
                    background: #4CAF50;
                    height: 100%;
                    width: ${(campaign.completed / campaign.levels) * 100}%;
                    transition: width 0.3s;
                "></div>
            </div>
            <button style="
                margin-top: 15px;
                padding: 10px 20px;
                background: #0066cc;
                color: white;
                border: none;
                border-radius: 5px;
                font-size: 16px;
                cursor: pointer;
                width: 100%;
            ">Play</button>
        `;

        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.borderColor = '#0066cc';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.borderColor = 'transparent';
        });

        card.querySelector('button').addEventListener('click', () => {
            this.selectCampaign(campaign.name);
        });

        return card;
    }

    // Handle campaign selection
    async selectCampaign(campaignName) {
        await this.campaignManager.loadCampaign(campaignName);
        this.container.style.display = 'none';
        this.game.startCampaignMode();
    }

    // Back to main menu
    backToMenu() {
        this.container.style.display = 'none';
        this.game.showMenu();
    }

    // Show level complete screen
    showLevelComplete(success, lemmingsSaved, lemmingsRequired) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: #2a2a3e;
            padding: 40px;
            border-radius: 10px;
            text-align: center;
            max-width: 400px;
        `;

        if (success) {
            content.innerHTML = `
                <h2 style="color: #4CAF50; font-size: 36px; margin-bottom: 20px;">Level Complete!</h2>
                <p style="font-size: 20px; margin-bottom: 30px;">
                    You saved ${lemmingsSaved} out of ${lemmingsRequired} lemmings!
                </p>
                <button onclick="campaignUI.nextLevel()" style="
                    padding: 15px 30px;
                    font-size: 18px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-right: 10px;
                ">Next Level</button>
                <button onclick="campaignUI.replayLevel()" style="
                    padding: 15px 30px;
                    font-size: 18px;
                    background: #0066cc;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">Replay</button>
            `;
        } else {
            content.innerHTML = `
                <h2 style="color: #f44336; font-size: 36px; margin-bottom: 20px;">Level Failed</h2>
                <p style="font-size: 20px; margin-bottom: 30px;">
                    You only saved ${lemmingsSaved} out of ${lemmingsRequired} lemmings.
                </p>
                <button onclick="campaignUI.replayLevel()" style="
                    padding: 15px 30px;
                    font-size: 18px;
                    background: #0066cc;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-right: 10px;
                ">Try Again</button>
                <button onclick="campaignUI.backToCampaignSelect()" style="
                    padding: 15px 30px;
                    font-size: 18px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">Exit</button>
            `;
        }

        overlay.appendChild(content);
        document.body.appendChild(overlay);
        this.currentOverlay = overlay;
    }

    nextLevel() {
        if (this.currentOverlay) {
            this.currentOverlay.remove();
        }
        
        if (this.campaignManager.isCampaignComplete()) {
            this.showCampaignComplete();
        } else {
            this.campaignManager.progressToNextLevel();
            this.game.loadNextCampaignLevel();
        }
    }

    replayLevel() {
        if (this.currentOverlay) {
            this.currentOverlay.remove();
        }
        this.game.restartLevel();
    }

    backToCampaignSelect() {
        if (this.currentOverlay) {
            this.currentOverlay.remove();
        }
        this.game.exitToMenu();
        this.showCampaignSelect();
    }

    showCampaignComplete() {
        // Show campaign completion screen
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        overlay.innerHTML = `
            <div style="
                background: #2a2a3e;
                padding: 60px;
                border-radius: 10px;
                text-align: center;
            ">
                <h1 style="color: #FFD700; font-size: 48px; margin-bottom: 30px;">
                    🎉 Campaign Complete! 🎉
                </h1>
                <p style="font-size: 24px; margin-bottom: 40px;">
                    Congratulations! You've completed the ${this.campaignManager.currentCampaign} campaign!
                </p>
                <button onclick="campaignUI.backToCampaignSelect()" style="
                    padding: 20px 40px;
                    font-size: 20px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">Select Another Campaign</button>
            </div>
        `;

        document.body.appendChild(overlay);
        this.currentOverlay = overlay;
    }
}

// Make campaignUI available globally for onclick handlers
let campaignUI;

export default CampaignUI;