export class DashboardManager {
    constructor() {
        // Cache DOM elements
        this.els = {
            valRainfall: document.getElementById('val-rainfall'),
            barRainfall: document.getElementById('bar-rainfall'),
            valWaterLevel: document.getElementById('val-water-level'),
            barWaterLevel: document.getElementById('bar-water-level'),
            valWasteLevel: document.getElementById('val-waste-level'),
            barWasteLevel: document.getElementById('bar-waste-level'),
            valStorageLevel: document.getElementById('val-storage-level'),
            barStorageLevel: document.getElementById('bar-storage-level'),
            
            flowUpstream: document.getElementById('val-flow-upstream'),
            flowDownstream: document.getElementById('val-flow-downstream'),
            flowStatus: document.getElementById('val-flow-status'),
            valveStatus: document.getElementById('val-valve-status'),
            
            riskPercent: document.getElementById('val-flood-risk-percent'),
            riskCursor: document.getElementById('risk-cursor'),
            riskText: document.getElementById('val-flood-risk-text'),
            
            ledIndicator: document.getElementById('system-status-led'),
            ledText: document.getElementById('system-status-text'),
            
            logContainer: document.getElementById('log-container'),
            
            // Drawer
            drawer: document.getElementById('component-telemetry'),
            drawerClose: document.getElementById('close-drawer'),
            compIcon: document.getElementById('comp-icon'),
            compName: document.getElementById('comp-name'),
            compStatus: document.getElementById('comp-status'),
            compPurpose: document.getElementById('comp-purpose'),
            compReading: document.getElementById('comp-reading'),
            compAction: document.getElementById('comp-action')
        };

        this.initEvents();
    }

    initEvents() {
        if (this.els.drawerClose) {
            this.els.drawerClose.addEventListener('click', () => this.hideComponentDrawer());
        }
    }

    log(message, type = 'normal') {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `<span class="log-time">[${timestamp}]</span> ${message}`;

        this.els.logContainer.appendChild(entry);
        this.els.logContainer.scrollTop = this.els.logContainer.scrollHeight;

        // Limit entries to prevent DOM bloat
        while (this.els.logContainer.children.length > 50) {
            this.els.logContainer.removeChild(this.els.logContainer.firstChild);
        }
    }

    update(state) {
        // 1. Progress Gauges
        if (this.els.valRainfall) this.els.valRainfall.innerHTML = `${state.rainRate} <span class="unit">mm/hr</span>`;
        if (this.els.barRainfall) this.els.barRainfall.style.width = `${Math.min(100, (state.rainRate / 120) * 100)}%`;

        if (this.els.valWaterLevel) this.els.valWaterLevel.textContent = `${state.waterLevel}%`;
        if (this.els.barWaterLevel) this.els.barWaterLevel.style.width = `${state.waterLevel}%`;

        if (this.els.valWasteLevel) this.els.valWasteLevel.textContent = `${state.wasteFill}%`;
        if (this.els.barWasteLevel) {
            this.els.barWasteLevel.style.width = `${state.wasteFill}%`;
            // Color transitions for waste bar
            this.setBarColor(this.els.barWasteLevel, state.wasteFill);
        }

        if (this.els.valStorageLevel) this.els.valStorageLevel.textContent = `${state.storageFill}%`;
        if (this.els.barStorageLevel) this.els.barStorageLevel.style.width = `${state.storageFill}%`;

        // 2. Metrics Rows
        if (this.els.flowUpstream) this.els.flowUpstream.textContent = `${state.flowUpstream} L/s`;
        if (this.els.flowDownstream) this.els.flowDownstream.textContent = `${state.flowDownstream} L/s`;
        
        if (this.els.flowStatus) {
            this.els.flowStatus.textContent = state.flowStatus;
            this.els.flowStatus.className = `status-badge ${state.flowStatusClass}`;
        }
        if (this.els.valveStatus) {
            this.els.valveStatus.textContent = state.valveStatus;
            this.els.valveStatus.className = `status-badge ${state.valveStatusClass}`;
        }

        // 3. Flood Risk Meter
        if (this.els.riskPercent) this.els.riskPercent.textContent = `${state.riskIndex}%`;
        if (this.els.riskCursor) this.els.riskCursor.style.left = `${state.riskIndex}%`;
        
        let riskLabel = 'LOW 🟢';
        let riskClass = 'green';
        if (state.riskIndex > 75) {
            riskLabel = 'CRITICAL 🔴';
            riskClass = 'red';
        } else if (state.riskIndex > 50) {
            riskLabel = 'HIGH 🟠';
            riskClass = 'orange';
        } else if (state.riskIndex > 25) {
            riskLabel = 'MODERATE 🟡';
            riskClass = 'yellow';
        }

        if (this.els.riskText) {
            this.els.riskText.textContent = riskLabel;
            this.els.riskText.style.color = `var(--clr-${riskClass})`;
        }

        // 4. Main LED system status
        let ledText = 'SYSTEM OPERATIONAL';
        let ledColor = 'green';
        let isBlinking = false;

        if (state.riskIndex > 75) {
            ledText = 'CRITICAL FLOOD RISK';
            ledColor = 'red';
            isBlinking = true;
        } else if (state.riskIndex > 50) {
            ledText = 'HIGH FLOOD RISK';
            ledColor = 'orange';
            isBlinking = true;
        } else if (state.wasteFill > 80) {
            ledText = 'MAINTENANCE CRITICAL';
            ledColor = 'yellow';
        } else if (state.wasteFill > 45) {
            ledText = 'MAINTENANCE REQUIRED';
            ledColor = 'yellow';
        }

        if (this.els.ledIndicator) {
            this.els.ledIndicator.className = `led ${ledColor} ${isBlinking ? 'blink' : ''}`;
        }
        if (this.els.ledText) {
            this.els.ledText.textContent = ledText;
            this.els.ledText.style.color = `var(--clr-${ledColor})`;
        }

        // 5. Update Component drawer real-time values if drawer is open
        if (this.activeComponentId && state.activeComponentDetails) {
            const details = state.activeComponentDetails;
            if (this.els.compStatus) this.els.compStatus.textContent = details.status;
            if (this.els.compReading) this.els.compReading.textContent = details.reading;
            if (this.els.compAction) this.els.compAction.textContent = details.action;
        }
    }

    setBarColor(bar, percent) {
        if (percent > 80) {
            bar.style.backgroundColor = 'var(--clr-red)';
        } else if (percent > 45) {
            bar.style.backgroundColor = 'var(--clr-yellow)';
        } else {
            bar.style.backgroundColor = 'var(--clr-accent)';
        }
    }

    showComponentDrawer(metadata) {
        this.activeComponentId = metadata.id;
        
        let icon = '⚙️';
        if (metadata.id === 'smart-grate') icon = '🕸️';
        else if (metadata.id === 'waste-filter') icon = '🌀';
        else if (metadata.id === 'waste-chamber') icon = '🗑️';
        else if (metadata.id.includes('sensor')) icon = '📡';
        else if (metadata.id === 'diversion-valve') icon = '🚪';
        else if (metadata.id === 'emergency-tank') icon = '🛢️';
        else if (metadata.id === 'treatment-unit') icon = '🧪';

        if (this.els.compIcon) this.els.compIcon.textContent = icon;
        if (this.els.compName) this.els.compName.textContent = metadata.name;
        if (this.els.compPurpose) this.els.compPurpose.textContent = metadata.purpose;
        if (this.els.compStatus) {
            this.els.compStatus.textContent = metadata.status;
            let cls = 'green';
            if (metadata.status.includes('CLOSED') || metadata.status.includes('Empty')) cls = 'blue';
            if (metadata.status.includes('WARNING') || metadata.status.includes('TRANSITION')) cls = 'yellow';
            if (metadata.status.includes('CRITICAL') || metadata.status.includes('OBSTRUCTED')) cls = 'red';
            this.els.compStatus.className = `status-pill ${cls}`;
        }
        if (this.els.compReading) this.els.compReading.textContent = metadata.reading;
        if (this.els.compAction) this.els.compAction.textContent = metadata.action;

        if (this.els.drawer) {
            this.els.drawer.classList.remove('hidden');
        }
    }

    hideComponentDrawer() {
        this.activeComponentId = null;
        if (this.els.drawer) {
            this.els.drawer.classList.add('hidden');
        }
    }
}
