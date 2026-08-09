export class SimulationEngine {
    constructor(cityManager, drainageManager, dashboard) {
        this.city = cityManager;
        this.drainage = drainageManager;
        this.dashboard = dashboard;

        // Core State Parameters
        this.rainIntensity = 'none'; // 'none', 'light', 'heavy', 'extreme'
        this.rainfallRate = 0; // mm/hr
        
        this.wastePercent = 0; // 0 to 100
        this.blockagePercent = 0; // 0 to 100
        
        this.inflowRate = 0; // L/s
        this.outflowRate = 0; // L/s
        this.pipeWaterLevel = 0; // 0 to 100 % (upstream water height)
        
        this.valveOpen = 0.0; // 0.0 (closed) to 1.0 (fully open)
        this.storagePercent = 0.0; // 0 to 100
        
        this.isAutoMode = true;
        this.isReuseActive = false;
        this.isFilterRotating = false;

        // Telemetry calibration constants
        this.maxInflow = 20.0; // L/s under extreme rain
        this.maxOutflow = 16.0; // L/s pipe max capacity
        this.tankCapacity = 10000; // Liters
        
        this.activeCity = 'tokyo'; // Tokyo is default
    }

    setRain(intensity) {
        this.rainIntensity = intensity;
        this.city.setRainIntensity(intensity);

        switch (intensity) {
            case 'none':
                this.rainfallRate = 0;
                this.inflowRate = 0;
                break;
            case 'light':
                this.rainfallRate = 18;
                this.inflowRate = 3.5;
                break;
            case 'heavy':
                this.rainfallRate = 65;
                this.inflowRate = 11.2;
                break;
            case 'extreme':
                this.rainfallRate = 115;
                this.inflowRate = 19.8;
                break;
        }

        this.dashboard.log(`Rainfall set to: ${intensity.toUpperCase()} (${this.rainfallRate} mm/hr)`);
    }

    addGarbage() {
        this.wastePercent = Math.min(100, this.wastePercent + 20);
        this.dashboard.log('Manual Intervention: Solid garbage added to storm grate.', 'warning');
    }

    triggerBlockage() {
        this.blockagePercent = Math.min(100, this.blockagePercent + 25);
        this.dashboard.log(`Manual Intervention: Drainage conduit pipe blocked (+25%). Current clog: ${this.blockagePercent}%`, 'blockage');
    }

    toggleAutoMode() {
        this.isAutoMode = !this.isAutoMode;
        this.dashboard.log(`AI Auto-Prevention Mode toggled: ${this.isAutoMode ? 'ON' : 'OFF'}`, this.isAutoMode ? 'success' : 'warning');
        return this.isAutoMode;
    }

    reset() {
        this.setRain('none');
        this.wastePercent = 0;
        this.blockagePercent = 0;
        this.pipeWaterLevel = 0;
        this.valveOpen = 0.0;
        this.storagePercent = 0.0;
        this.isReuseActive = false;
        this.isFilterRotating = false;
        
        this.drainage.setValveOpen(0);
        this.drainage.setWasteLevel(0);
        this.drainage.setStorageLevel(0);
        this.drainage.updateWaterReuse(false);
        this.drainage.components['waste-filter'].userData.action = 'Scanning';
        
        this.dashboard.log('System telemetry reset. Re-calibrating sensors...');
    }

    // Trigger specific scenario scripts
    triggerScenario(id) {
        this.reset();
        
        switch (id) {
            case 1: // Normal Operation
                this.setRain('light');
                this.isAutoMode = true;
                break;
                
            case 2: // Waste Accumulation
                this.setRain('light');
                this.wastePercent = 65;
                this.isAutoMode = false; // Disable auto to showcase accumulation without immediate clearance
                this.dashboard.log('Scenario 2: Simulating organic debris and plastic accumulation.', 'warning');
                break;
                
            case 3: // Clogged Blockage
                this.setRain('heavy');
                this.blockagePercent = 75;
                this.isAutoMode = false; // Disable auto first to showcase rising water
                this.dashboard.log('Scenario 3: Main drainage conduit clogged. Inflow > Outflow.', 'blockage');
                break;
                
            case 4: // Extreme storm
                this.setRain('extreme');
                this.wastePercent = 30;
                this.blockagePercent = 60;
                this.isAutoMode = true;
                this.dashboard.log('Scenario 4: Extreme Storm Warning. AI automatic diversion engaged.', 'critical');
                break;
        }
    }

    update(deltaTime) {
        // 1. Calculate Outflow based on Clogging & Main Pipe capacity
        // Clogging reduces outflow linearly
        const clogFactor = (100 - this.blockagePercent) / 100;
        const nominalOutflow = Math.min(this.inflowRate, this.maxOutflow);
        this.outflowRate = nominalOutflow * clogFactor;

        // 2. Calculate Pipe Water Level (Inlet / Upstream Backup)
        // Water levels rise if inflow exceeds outflow, and fall if outflow is greater (when raining stops)
        const netFlow = this.inflowRate - this.outflowRate;
        
        if (this.inflowRate > 0) {
            // Water rises
            this.pipeWaterLevel = Math.min(100, this.pipeWaterLevel + (netFlow * 0.4 + this.inflowRate * 0.1) * deltaTime * 15);
        } else {
            // Draining water out
            const drainRate = 12.0 * clogFactor; // rate at which residual water escapes downstream
            this.pipeWaterLevel = Math.max(0, this.pipeWaterLevel - drainRate * deltaTime * 5);
        }

        // Adjust water level minimum based on rain inflow
        if (this.inflowRate > 0 && this.pipeWaterLevel < this.inflowRate * 4) {
            this.pipeWaterLevel = this.inflowRate * 4;
        }

        // 3. AI Smart Intervention Core (Automatic Prevention)
        if (this.isAutoMode) {
            // A. Waste Filter Auto Clearing
            if (this.wastePercent > 50 && !this.isFilterRotating) {
                this.isFilterRotating = true;
                this.drainage.components['waste-filter'].userData.action = 'ROTATING';
                this.dashboard.log('AI System: Critical waste detected. Rotating filter cylinder.', 'warning');
            }
            
            if (this.isFilterRotating) {
                // Clear waste at 8% per second
                this.wastePercent = Math.max(0, this.wastePercent - 8 * deltaTime);
                if (this.wastePercent === 0) {
                    this.isFilterRotating = false;
                    this.drainage.components['waste-filter'].userData.action = 'Scanning';
                    this.dashboard.log('AI System: Waste filter cleared. Returning filter to standby.', 'success');
                }
            }

            // B. Blockage Auto Flush
            // If clogged, high pressure jets and filter action clears blockage slowly
            if (this.blockagePercent > 0) {
                this.blockagePercent = Math.max(0, this.blockagePercent - 3 * deltaTime);
                if (this.blockagePercent === 0) {
                    this.dashboard.log('AI System: Main conduit obstruction cleared successfully.', 'success');
                }
            }

            // C. Automatic Diversion Valve Trigger
            // Open valve if water level rises above 55%
            const targetValve = (this.pipeWaterLevel > 55) ? 1.0 : 0.0;
            // Smoothly slide valve
            if (this.valveOpen < targetValve) {
                this.valveOpen = Math.min(targetValve, this.valveOpen + deltaTime * 2.0);
                if (this.valveOpen === 1.0) {
                    this.dashboard.log('AI System: Activating motorized diversion valve. Stormwater routed to Emergency Storage Tank.', 'success');
                }
            } else if (this.valveOpen > targetValve) {
                this.valveOpen = Math.max(targetValve, this.valveOpen - deltaTime * 1.5);
                if (this.valveOpen === 0.0) {
                    this.dashboard.log('AI System: Inlet levels normal. Closing diversion valve.', 'normal');
                }
            }
        } else {
            // Manual mode: waste and blockages don't clear automatically
            // Filter does not rotate
            this.isFilterRotating = false;
            this.drainage.components['waste-filter'].userData.action = 'Scanning';
        }

        // 4. Emergency Storage Tank filling logic
        let divertedFlow = 0;
        if (this.valveOpen > 0.1 && this.pipeWaterLevel > 40) {
            // Water diverted into tank based on valve opening and overflow rate
            divertedFlow = (this.inflowRate - this.outflowRate) * this.valveOpen;
            if (divertedFlow <= 0) divertedFlow = this.inflowRate * 0.4 * this.valveOpen; // Force diversion if backed up
            
            // Add to storage (tank holds 10000 L, so 1% = 100 L)
            const fillRate = (divertedFlow / this.tankCapacity) * 100 * 50; // accelerated for simulation visibility
            this.storagePercent = Math.min(100, this.storagePercent + fillRate * deltaTime);
            
            if (this.storagePercent >= 100) {
                this.dashboard.log('CRITICAL: Emergency storage reservoir at maximum capacity!', 'critical');
            }
        }

        // 5. Water Reuse Loop (Watering Gardens)
        // If storm is over (no rain or light rain) and storage has water, irrigate the gardens
        if ((this.rainIntensity === 'none' || this.rainIntensity === 'light') && this.storagePercent > 0) {
            if (!this.isReuseActive) {
                this.isReuseActive = true;
                this.drainage.updateWaterReuse(true);
                this.dashboard.log('Sustainability Protocol: Initiating water treatment and irrigation reuse.', 'success');
            }
            
            // Drain storage slowly
            this.storagePercent = Math.max(0, this.storagePercent - 1.8 * deltaTime);
            
            if (this.storagePercent === 0) {
                this.isReuseActive = false;
                this.drainage.updateWaterReuse(false);
                this.dashboard.log('Sustainability Protocol: Storage tank empty. Irrigation paused.', 'normal');
            }
        } else {
            if (this.isReuseActive) {
                this.isReuseActive = false;
                this.drainage.updateWaterReuse(false);
            }
        }

        // 6. Calculate conceptual Flood Risk Index
        // Formula: Risk = Rain * 0.3 + Blockage * 0.4 + (WaterLevel > 60) * 0.3
        let rainScore = 0;
        if (this.rainIntensity === 'light') rainScore = 20;
        if (this.rainIntensity === 'heavy') rainScore = 60;
        if (this.rainIntensity === 'extreme') rainScore = 100;

        let riskScore = (rainScore * 0.25) + (this.blockagePercent * 0.45) + (this.pipeWaterLevel * 0.3);
        
        // If valve is open and storage is receiving, it buffers the risk!
        if (this.valveOpen > 0.5 && this.storagePercent < 98) {
            riskScore = Math.max(10, riskScore - (35 * this.valveOpen)); // Risk drops because of diversion
        }
        
        riskScore = Math.min(100, Math.max(0, Math.round(riskScore)));

        // Update Three.js meshes
        this.drainage.setValveOpen(this.valveOpen);
        this.drainage.setWasteLevel(this.wastePercent);
        this.drainage.setStorageLevel(this.storagePercent);

        // Map flow rates to particle animations (with a minimum baseline flow so the pipes always look alive)
        const particleMain = Math.max(0.18, (this.outflowRate > 0) ? (this.outflowRate / this.maxOutflow) : 0.18);
        const particleDiv = Math.max(0.08, (divertedFlow > 0) ? (divertedFlow / this.maxInflow) : 0.08);
        const particleReuse = Math.max(0.10, this.isReuseActive ? 0.6 : 0.10);
        this.drainage.setFlowRates({
            main: particleMain,
            diversion: particleDiv,
            reuse: particleReuse
        });

        // Set status LEDs on 3D flow sensors
        let s1State = 'green';
        if (this.pipeWaterLevel > 80) s1State = 'red';
        else if (this.pipeWaterLevel > 50) s1State = 'orange';
        else if (this.pipeWaterLevel > 25) s1State = 'yellow';

        let s2State = 'green';
        if (this.blockagePercent > 70) s2State = 'red';
        else if (this.blockagePercent > 40) s2State = 'orange';
        else if (this.blockagePercent > 10) s2State = 'yellow';

        let s3State = 'green';
        // Downstream is critical if flow is blocked downstream
        if (this.blockagePercent > 80 && this.inflowRate > 5) s3State = 'red';
        else if (this.blockagePercent > 40) s3State = 'orange';

        this.drainage.updateSensorLeds(s1State, s2State, s3State);

        // Update S1, S2, S3 userData readings for Raycasting Tooltips
        this.drainage.components['sensor-upstream'].userData.reading = `${this.inflowRate.toFixed(1)} L/s`;
        this.drainage.components['sensor-upstream'].userData.status = this.pipeWaterLevel > 75 ? 'CRITICAL BACKUP' : 'Normal';
        
        this.drainage.components['sensor-blockage'].userData.reading = `${Math.round(this.blockagePercent)}% Blocked`;
        this.drainage.components['sensor-blockage'].userData.status = this.blockagePercent > 60 ? 'OBSTRUCTED' : 'Clear';
        
        this.drainage.components['sensor-downstream'].userData.reading = `${this.outflowRate.toFixed(1)} L/s`;
        this.drainage.components['sensor-downstream'].userData.status = this.blockagePercent > 65 ? 'REDUCED FLOW' : 'Normal';

        // Update 3D Holographic Label Texts & Colors
        const getColorHex = (stateColor) => {
            if (stateColor === 'red') return '#ef4444';
            if (stateColor === 'orange') return '#f97316';
            if (stateColor === 'yellow') return '#f59e0b';
            if (stateColor === 'blue') return '#3b82f6';
            return '#10b981'; // green
        };

        // Dynamic label naming based on active city system
        let grateLabel = 'INLET GRATE';
        let wasteLabel = 'WASTE CHAMBER';
        let s1Label = 'S1 INFLOW';
        let s2Label = 'S2 CLOG';
        let s3Label = 'S3 DISCHARGE';
        let valveLabel = 'DIVERSION VALVE';
        let tankLabel = 'RESERVOIR TANK';
        let gardenLabel = 'REUSE IRRIGATION';

        const city = this.activeCity || 'tokyo';
        if (city === 'tokyo') {
            grateLabel = 'DEEP INTAKE';
            wasteLabel = 'DEBRIS CHAMBER';
            s1Label = 'TUNNEL INFLOW';
            s2Label = 'SURGE PRESSURE';
            s3Label = 'RIVER OUTFLOW';
            valveLabel = 'TURBINE PUMPS';
            tankLabel = 'SURGE CATHEDRAL';
            gardenLabel = 'PUBLIC REUSE';
        } else if (city === 'london') {
            grateLabel = 'VICTORIAN SEWER';
            wasteLabel = 'CSO SCREEN';
            s1Label = 'GRAVITY INFLOW';
            s2Label = 'CSO BLOCKAGE';
            s3Label = 'THAMES OUTFLOW';
            valveLabel = 'CSO OVERFLOW GATE';
            tankLabel = 'TIDEWAY TUNNEL';
            gardenLabel = 'CLEAN REUSE';
        } else if (city === 'newyork') {
            grateLabel = 'BIOSWALE BED';
            wasteLabel = 'SEDIMENT FILTER';
            s1Label = 'SOIL ABSORPTION';
            s2Label = 'RUNOFF SURCHARGE';
            s3Label = 'HARBOR OUTFLOW';
            valveLabel = 'MAIN BYPASS';
            tankLabel = 'AQUIFER RECHARGE';
            gardenLabel = 'RAIN GARDEN';
        } else if (city === 'sydney') {
            grateLabel = 'GPT CURB INTAKE';
            wasteLabel = 'GPT NET SCREEN';
            s1Label = 'GPT INFLOW';
            s2Label = 'GPT SCREEN CLOG';
            s3Label = 'PACIFIC DISCHARGE';
            valveLabel = 'GPT FLUSH VALVE';
            tankLabel = 'VORTEX CHAMBER';
            gardenLabel = 'ESTUARY FLUSH';
        }

        const grateColor = this.wastePercent > 80 ? '#ef4444' : (this.wastePercent > 45 ? '#f59e0b' : '#06b6d4');
        this.drainage.updateHologramLabel('grate', `${grateLabel}\nFlow: ${this.inflowRate.toFixed(1)} L/s`, grateColor);

        const wasteColor = this.wastePercent > 80 ? '#ef4444' : (this.wastePercent > 45 ? '#f59e0b' : '#f97316');
        this.drainage.updateHologramLabel('waste', `${wasteLabel}\nFill: ${Math.round(this.wastePercent)}%`, wasteColor);

        this.drainage.updateHologramLabel('s1', `${s1Label}\n${this.inflowRate.toFixed(1)} L/s`, getColorHex(s1State));
        this.drainage.updateHologramLabel('s2', `${s2Label}\nClog: ${Math.round(this.blockagePercent)}%`, getColorHex(s2State));
        this.drainage.updateHologramLabel('s3', `${s3Label}\n${this.outflowRate.toFixed(1)} L/s`, getColorHex(s3State));

        const valveColor = this.valveOpen > 0.8 ? '#3b82f6' : (this.valveOpen > 0 ? '#f59e0b' : '#ef4444');
        const valveText = this.valveOpen > 0.8 ? 'OPEN' : (this.valveOpen > 0 ? 'ADJUSTING' : 'CLOSED');
        this.drainage.updateHologramLabel('valve', `${valveLabel}\n${valveText}`, valveColor);

        const tankColor = this.storagePercent > 90 ? '#ef4444' : (this.storagePercent > 50 ? '#f97316' : '#3b82f6');
        this.drainage.updateHologramLabel('tank', `${tankLabel}\n${Math.round(this.storagePercent * 100)} L (${Math.round(this.storagePercent)}%)`, tankColor);

        const gardenColor = this.isReuseActive ? '#3b82f6' : '#10b981';
        this.drainage.updateHologramLabel('garden', `${gardenLabel}\n${this.isReuseActive ? 'ACTIVE' : 'STANDBY'}`, gardenColor);

        // Update dashboard UI elements
        this.dashboard.update({
            rainRate: this.rainfallRate,
            waterLevel: Math.round(this.pipeWaterLevel),
            wasteFill: Math.round(this.wastePercent),
            storageFill: Math.round(this.storagePercent),
            storageCapacity: this.tankCapacity,
            flowUpstream: this.inflowRate.toFixed(1),
            flowDownstream: this.outflowRate.toFixed(1),
            flowStatus: this.blockagePercent > 60 ? 'Critical Obstruction' : (this.blockagePercent > 20 ? 'Reduced Flow' : 'Normal'),
            flowStatusClass: this.blockagePercent > 60 ? 'red' : (this.blockagePercent > 20 ? 'orange' : 'green'),
            valveStatus: this.valveOpen > 0.8 ? 'OPEN' : (this.valveOpen > 0 ? 'TRANSITIONING' : 'CLOSED'),
            valveStatusClass: this.valveOpen > 0.8 ? 'blue' : (this.valveOpen > 0 ? 'yellow' : 'green'),
            riskIndex: riskScore,
            isAutoMode: this.isAutoMode
        });
    }

    setCitySystem(cityName) {
        this.activeCity = cityName;
        
        // Calibrate simulation constants according to municipal capacity
        if (cityName === 'tokyo') {
            this.maxInflow = 45.0;     // Massive tunnels absorb heavy rate
            this.tankCapacity = 50000; // Giant G-Cans surge cathedral
        } else if (cityName === 'london') {
            this.maxInflow = 30.0;
            this.tankCapacity = 25000; // Long super-sewer interceptor
        } else if (cityName === 'newyork') {
            this.maxInflow = 15.0;     // Sponge bioswales absorb 60% runoff
            this.tankCapacity = 10000;
        } else { // sydney
            this.maxInflow = 25.0;
            this.tankCapacity = 12000;
        }

        // Reset variables for a fresh start
        this.reset();
    }
}
