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
            svgWaterBubble: document.getElementById('svg-water-bubble'),
            svgLiquidFill: document.getElementById('svg-liquid-fill'),
            
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

        const capacity = state.storageCapacity || 10000;
        const liters = Math.round((state.storageFill * capacity) / 100);
        if (this.els.valStorageLevel) this.els.valStorageLevel.innerHTML = `${liters} L <span class="unit">(${state.storageFill}%)</span>`;
        if (this.els.barStorageLevel) this.els.barStorageLevel.style.width = `${state.storageFill}%`;

        // Update the SVG height percentage to slosh and fill the wave indicators
        if (this.els.svgWaterBubble) {
            this.els.svgWaterBubble.style.height = `${state.waterLevel}%`;
        }
        if (this.els.svgLiquidFill) {
            this.els.svgLiquidFill.style.height = `${state.storageFill}%`;
        }

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

    setCitySystem(cityName) {
        this.activeCity = cityName;

        // Update HUD title
        const subtitleEl = document.getElementById('city-system-title');
        if (subtitleEl) {
            if (cityName === 'tokyo') {
                subtitleEl.textContent = 'SYSTEM: TOKYO G-CANS (SURGE CATHEDRAL)';
                this.log('Switched to Tokyo system: Deep discharge tunnels & turbine pumps.', 'success');
            } else if (cityName === 'london') {
                subtitleEl.textContent = 'SYSTEM: LONDON TIDEWAY (CSO INTERCEPTOR)';
                this.log('Switched to London system: Victorian combined sewers & Tideway super-sewer.', 'success');
            } else if (cityName === 'newyork') {
                subtitleEl.textContent = 'SYSTEM: NEW YORK SPONGE CITY (BIOSWALES)';
                this.log('Switched to New York system: Permeable bioswales & natural aquifer buffers.', 'success');
            } else if (cityName === 'sydney') {
                subtitleEl.textContent = 'SYSTEM: SYDNEY GPT (GROSS POLLUTANT TRAP)';
                this.log('Switched to Sydney system: Gross pollutant traps & centrifugal vortex separators.', 'success');
            }
        }

        // Update beaker scale tick labels based on active city's capacity
        const ticksEl = document.getElementById('beaker-ticks');
        const titleEl = document.getElementById('lbl-reservoir-title');
        if (ticksEl) {
            let ticks = ['10k', '7k', '5k', '2k', '0'];
            let title = 'RESERVOIR TANK';
            if (cityName === 'tokyo') {
                ticks = ['50k', '35k', '25k', '10k', '0'];
                title = 'SURGE CATHEDRAL';
            } else if (cityName === 'london') {
                ticks = ['25k', '18k', '12k', '6k', '0'];
                title = 'TIDEWAY TUNNEL';
            } else if (cityName === 'newyork') {
                ticks = ['10k', '7k', '5k', '2k', '0'];
                title = 'AQUIFER RECHARGE';
            } else if (cityName === 'sydney') {
                ticks = ['12k', '9k', '6k', '3k', '0'];
                title = 'VORTEX CHAMBER';
            }
            if (titleEl) titleEl.textContent = title;
            ticksEl.innerHTML = ticks.map(t => `<span>${t}</span>`).join('');
        }
    }
}
