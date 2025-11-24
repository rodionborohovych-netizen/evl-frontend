// EVL v2.0 - Complete Configuration JavaScript
// ============================================================================

// Global state
let chargerConfigCount = 0;
let generatedSchema = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Add initial charger configuration
    addChargerConfig();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('EVL Configuration System Loaded');
});

function setupEventListeners() {
    // Operating hours radio buttons
    document.querySelectorAll('input[name="operatingHours"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.getElementById('customHoursSection').classList.toggle('active', this.value === 'custom');
        });
    });
}

// ============================================================================
// CHARGER CONFIGURATION MANAGEMENT
// ============================================================================

function addChargerConfig() {
    chargerConfigCount++;
    const container = document.getElementById('chargerConfigs');
    
    const configHtml = `
        <div class="charger-config" id="chargerConfig${chargerConfigCount}">
            <div class="charger-config-header">
                <h4>Charger Configuration #${chargerConfigCount}</h4>
                ${chargerConfigCount > 1 ? `<button class="remove-btn" onclick="removeChargerConfig(${chargerConfigCount})">✕ Remove</button>` : ''}
            </div>
            
            <div class="input-group">
                <label>Power Level <span class="required">*</span></label>
                <select id="power${chargerConfigCount}" class="charger-power">
                    <option value="">Select power level...</option>
                    <option value="7">7 kW - AC Slow</option>
                    <option value="22">22 kW - AC Fast</option>
                    <option value="40">40 kW - DC</option>
                    <option value="60">60 kW - DC</option>
                    <option value="120">120 kW - DC Fast</option>
                    <option value="150">150 kW - DC Ultra-Rapid</option>
                    <option value="320">320 kW - DC Ultra-Fast</option>
                </select>
                <div class="error-message" id="power${chargerConfigCount}Error"></div>
            </div>
            
            <div class="input-group">
                <label>Number of Chargers <span class="required">*</span></label>
                <input type="number" id="quantity${chargerConfigCount}" class="charger-quantity" min="1" value="2" placeholder="e.g., 2">
                <div class="error-message" id="quantity${chargerConfigCount}Error"></div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', configHtml);
}

function removeChargerConfig(id) {
    const element = document.getElementById(`chargerConfig${id}`);
    if (element) {
        element.remove();
    }
}

// ============================================================================
// UI HELPERS
// ============================================================================

function toggleSection(sectionId, show) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.toggle('active', show);
    }
}

function showTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateAndGenerate() {
    // Clear previous validation messages
    clearValidationMessages();
    
    const errors = [];
    const warnings = [];
    
    // Collect all form data
    const formData = collectFormData();
    
    // Validate required fields
    const validationResult = validateFormData(formData);
    errors.push(...validationResult.errors);
    warnings.push(...validationResult.warnings);
    
    // Display validation results
    if (errors.length > 0) {
        displayValidationErrors(errors);
        return;
    }
    
    // Generate schema
    generatedSchema = generateSchema(formData);
    
    // Display success and output
    displaySuccess(warnings);
    displayOutput(generatedSchema, warnings);
}

function collectFormData() {
    return {
        // Location
        location: {
            street: getValue('street'),
            city: getValue('city'),
            postcode: getValue('postcode'),
            country: getValue('country'),
            latitude: getNumericValue('latitude'),
            longitude: getNumericValue('longitude'),
            radius_km: getNumericValue('radius')
        },
        
        // Chargers
        chargers: collectChargerConfigs(),
        
        // Site conditions
        site: {
            power_capacity_kw: getNumericValue('powerCapacity'),
            parking_bays: getNumericValue('parkingBays'),
            parking_type: getValue('parkingType'),
            operating_hours: collectOperatingHours()
        },
        
        // Financial
        financial: {
            energy_cost_per_kwh: getNumericValue('energyCost'),
            use_national_average: getChecked('useNationalAverage'),
            tariffs: collectTariffs(),
            rent_per_month: getNumericValue('rent'),
            detailed_opex: collectDetailedOpex(),
            capex: {
                hardware_per_charger: getNumericValue('capexHardware'),
                installation_per_charger: getNumericValue('capexInstallation'),
                grid_connection: getNumericValue('capexGrid'),
                grid_unknown: getChecked('gridUnknown'),
                civil_works: getNumericValue('capexCivil')
            }
        },
        
        // Business model
        business: {
            ownership_model: getValue('ownershipModel'),
            energy_source: getValue('energySource'),
            override_utilization: getChecked('overrideUtilization'),
            utilization_rate: getNumericValue('utilizationRate')
        }
    };
}

function collectChargerConfigs() {
    const configs = [];
    const configElements = document.querySelectorAll('.charger-config');
    
    configElements.forEach((element, index) => {
        const id = element.id.replace('chargerConfig', '');
        const power = getValue(`power${id}`);
        const quantity = getNumericValue(`quantity${id}`);
        
        if (power && quantity) {
            configs.push({
                power_kw: parseFloat(power),
                quantity: quantity,
                charger_type: parseInt(power) >= 40 ? 'DC' : 'AC'
            });
        }
    });
    
    return configs;
}

function collectOperatingHours() {
    const type = getRadioValue('operatingHours');
    
    if (type === 'custom') {
        return {
            type: 'custom',
            opening_time: getValue('openingTime'),
            closing_time: getValue('closingTime')
        };
    }
    
    return { type: type };
}

function collectTariffs() {
    const tariffs = {
        standard: getNumericValue('tariffStandard')
    };
    
    if (getChecked('enablePeakPricing')) {
        tariffs.peak = getNumericValue('tariffPeak');
        tariffs.off_peak = getNumericValue('tariffOffPeak');
    }
    
    if (getChecked('enableFleetPricing')) {
        tariffs.fleet = getNumericValue('tariffFleet');
    }
    
    return tariffs;
}

function collectDetailedOpex() {
    if (!getChecked('enableDetailedOpex')) {
        return null;
    }
    
    return {
        maintenance: getNumericValue('opexMaintenance') || 0,
        internet: getNumericValue('opexInternet') || 0,
        insurance: getNumericValue('opexInsurance') || 0,
        security: getNumericValue('opexSecurity') || 0,
        cleaning: getNumericValue('opexCleaning') || 0,
        staff: getNumericValue('opexStaff') || 0,
        snow_removal: getNumericValue('opexSnow') || 0
    };
}

function validateFormData(data) {
    const errors = [];
    const warnings = [];
    
    // Location validation
    if (!data.location.street) errors.push('Street address is required');
    if (!data.location.city) errors.push('City is required');
    if (!data.location.postcode) errors.push('Postcode is required');
    if (!data.location.country) errors.push('Country is required');
    
    if (data.location.radius_km < 0.5 || data.location.radius_km > 10) {
        errors.push('Analysis radius must be between 0.5 and 10 km');
    }
    
    // Charger validation
    if (data.chargers.length === 0) {
        errors.push('At least one charger configuration is required');
    }
    
    data.chargers.forEach((charger, index) => {
        if (!charger.power_kw) {
            errors.push(`Charger ${index + 1}: Power level is required`);
        }
        if (!charger.quantity || charger.quantity < 1) {
            errors.push(`Charger ${index + 1}: Quantity must be at least 1`);
        }
    });
    
    // Financial validation
    if (!data.financial.energy_cost_per_kwh && !data.financial.use_national_average) {
        errors.push('Electricity purchase price is required');
    }
    
    if (data.financial.energy_cost_per_kwh < 0) {
        errors.push('Electricity cost cannot be negative');
    }
    
    if (!data.financial.tariffs.standard) {
        errors.push('Standard tariff is required');
    }
    
    if (data.financial.tariffs.standard <= data.financial.energy_cost_per_kwh) {
        warnings.push('Selling price is lower than or equal to purchase price - check for profitability');
    }
    
    if (data.financial.rent_per_month === null || data.financial.rent_per_month === undefined) {
        errors.push('Rent/lease cost is required (enter 0 if none)');
    }
    
    if (!data.financial.capex.hardware_per_charger) {
        errors.push('Hardware cost per charger is required');
    }
    
    if (!data.financial.capex.installation_per_charger) {
        errors.push('Installation cost per charger is required');
    }
    
    // Business model validation
    if (!data.business.ownership_model) {
        errors.push('Ownership model is required');
    }
    
    // Warnings for missing optional data
    if (!data.site.power_capacity_kw) {
        warnings.push('Power capacity unknown - grid feasibility analysis will be limited');
    }
    
    if (!data.financial.capex.grid_connection && !data.financial.capex.grid_unknown) {
        warnings.push('Grid connection cost not specified - estimate will be used');
    }
    
    if (!data.location.latitude || !data.location.longitude) {
        warnings.push('GPS coordinates will be auto-detected from address');
    }
    
    return { errors, warnings };
}

// ============================================================================
// SCHEMA GENERATION
// ============================================================================

function generateSchema(data) {
    const schema = {
        meta: {
            schema_version: "2.0",
            generated_at: new Date().toISOString(),
            generated_by: "EVL Configuration System"
        },
        
        location: {
            address: {
                street: data.location.street,
                city: data.location.city,
                postcode: data.location.postcode,
                country: data.location.country,
                full_address: `${data.location.street}, ${data.location.city}, ${data.location.postcode}, ${data.location.country}`
            },
            coordinates: {
                latitude: data.location.latitude,
                longitude: data.location.longitude,
                auto_detect: !data.location.latitude || !data.location.longitude
            },
            analysis_radius_km: data.location.radius_km
        },
        
        planned_installation: {
            chargers: data.chargers,
            total_chargers: data.chargers.reduce((sum, c) => sum + c.quantity, 0),
            total_power_kw: data.chargers.reduce((sum, c) => sum + (c.power_kw * c.quantity), 0),
            power_levels: [...new Set(data.chargers.map(c => c.power_kw))].sort((a, b) => a - b)
        },
        
        site_conditions: {
            electrical: {
                available_capacity_kw: data.site.power_capacity_kw,
                capacity_known: !!data.site.power_capacity_kw
            },
            parking: {
                bays: data.site.parking_bays,
                type: data.site.parking_type,
                specified: !!data.site.parking_bays
            },
            operating_hours: data.site.operating_hours
        },
        
        financial_parameters: {
            opex: {
                energy: {
                    purchase_price_per_kwh: data.financial.energy_cost_per_kwh,
                    use_national_average: data.financial.use_national_average,
                    currency: "EUR"
                },
                tariffs: {
                    ...data.financial.tariffs,
                    currency: "EUR",
                    has_peak_pricing: !!data.financial.tariffs.peak,
                    has_fleet_pricing: !!data.financial.tariffs.fleet
                },
                fixed_costs: {
                    rent_per_month: data.financial.rent_per_month,
                    detailed_breakdown: data.financial.detailed_opex,
                    total_monthly_opex: calculateTotalOpex(data.financial)
                }
            },
            capex: {
                per_charger: {
                    hardware: data.financial.capex.hardware_per_charger,
                    installation: data.financial.capex.installation_per_charger,
                    currency: "EUR"
                },
                site_wide: {
                    grid_connection: data.financial.capex.grid_connection,
                    grid_connection_known: !data.financial.capex.grid_unknown,
                    civil_works: data.financial.capex.civil_works || 0,
                    currency: "EUR"
                },
                total_capex: calculateTotalCapex(data)
            }
        },
        
        business_model: {
            ownership: data.business.ownership_model,
            energy_source: data.business.energy_source,
            utilization: {
                use_model_based: !data.business.override_utilization,
                override_rate: data.business.override_utilization ? data.business.utilization_rate : null
            }
        },
        
        analysis_configuration: {
            enable_demand_scoring: true,
            enable_competition_analysis: true,
            enable_traffic_analysis: true,
            enable_grid_feasibility: !!data.site.power_capacity_kw,
            enable_roi_calculation: true,
            enable_risk_assessment: true,
            include_recommendations: true
        }
    };
    
    return schema;
}

function calculateTotalOpex(financial) {
    let total = financial.rent_per_month || 0;
    
    if (financial.detailed_opex) {
        total += financial.detailed_opex.maintenance || 0;
        total += financial.detailed_opex.internet || 0;
        total += financial.detailed_opex.insurance || 0;
        total += financial.detailed_opex.security || 0;
        total += financial.detailed_opex.cleaning || 0;
        total += financial.detailed_opex.staff || 0;
        total += financial.detailed_opex.snow_removal || 0;
    }
    
    return total;
}

function calculateTotalCapex(data) {
    const chargerCapex = data.chargers.reduce((sum, charger) => {
        const perUnit = (data.financial.capex.hardware_per_charger || 0) + 
                        (data.financial.capex.installation_per_charger || 0);
        return sum + (perUnit * charger.quantity);
    }, 0);
    
    const gridCapex = data.financial.capex.grid_connection || 0;
    const civilCapex = data.financial.capex.civil_works || 0;
    
    return chargerCapex + gridCapex + civilCapex;
}

// ============================================================================
// DISPLAY FUNCTIONS
// ============================================================================

function displayValidationErrors(errors) {
    const summary = document.getElementById('validationSummary');
    const list = document.getElementById('validationList');
    
    list.innerHTML = '';
    errors.forEach(error => {
        const li = document.createElement('li');
        li.textContent = error;
        list.appendChild(li);
    });
    
    summary.classList.add('active');
    document.getElementById('successMessage').classList.remove('active');
    document.getElementById('outputCard').style.display = 'none';
    
    // Scroll to validation summary
    summary.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function displaySuccess(warnings) {
    const summary = document.getElementById('validationSummary');
    const success = document.getElementById('successMessage');
    
    summary.classList.remove('active');
    success.classList.add('active');
    
    if (warnings.length > 0) {
        const warningText = document.createElement('p');
        warningText.innerHTML = '<strong>⚠️ Warnings:</strong>';
        const warningList = document.createElement('ul');
        warningList.style.marginTop = '10px';
        warningList.style.color = '#92400e';
        
        warnings.forEach(warning => {
            const li = document.createElement('li');
            li.textContent = warning;
            warningList.appendChild(li);
        });
        
        success.appendChild(warningText);
        success.appendChild(warningList);
    }
}

function displayOutput(schema, warnings) {
    const outputCard = document.getElementById('outputCard');
    const jsonOutput = document.getElementById('jsonOutput');
    const summaryContent = document.getElementById('summaryContent');
    const validationReport = document.getElementById('validationReport');
    
    // JSON Output
    jsonOutput.textContent = JSON.stringify(schema, null, 2);
    
    // Summary
    summaryContent.innerHTML = generateSummaryHTML(schema);
    
    // Validation Report
    validationReport.innerHTML = generateValidationReportHTML(schema, warnings);
    
    outputCard.style.display = 'block';
    outputCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function generateSummaryHTML(schema) {
    return `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h3 style="color: #333; margin-bottom: 15px;">Configuration Summary</h3>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: #667eea; margin-bottom: 10px;">📍 Location</h4>
                <p><strong>Address:</strong> ${schema.location.address.full_address}</p>
                <p><strong>Analysis Radius:</strong> ${schema.location.analysis_radius_km} km</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: #667eea; margin-bottom: 10px;">⚡ Chargers</h4>
                <p><strong>Total Chargers:</strong> ${schema.planned_installation.total_chargers}</p>
                <p><strong>Total Power:</strong> ${schema.planned_installation.total_power_kw} kW</p>
                <p><strong>Power Levels:</strong> ${schema.planned_installation.power_levels.join(', ')} kW</p>
                <div style="margin-top: 10px;">
                    ${schema.planned_installation.chargers.map(c => 
                        `<p>• ${c.quantity}× ${c.power_kw} kW (${c.charger_type})</p>`
                    ).join('')}
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: #667eea; margin-bottom: 10px;">💰 Financial</h4>
                <p><strong>Total CAPEX:</strong> €${schema.financial_parameters.capex.total_capex.toLocaleString()}</p>
                <p><strong>Monthly OPEX:</strong> €${schema.financial_parameters.opex.fixed_costs.total_monthly_opex.toLocaleString()}</p>
                <p><strong>Energy Purchase:</strong> €${schema.financial_parameters.opex.energy.purchase_price_per_kwh}/kWh</p>
                <p><strong>Standard Tariff:</strong> €${schema.financial_parameters.opex.tariffs.standard}/kWh</p>
                <p><strong>Margin per kWh:</strong> €${(schema.financial_parameters.opex.tariffs.standard - schema.financial_parameters.opex.energy.purchase_price_per_kwh).toFixed(2)}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: #667eea; margin-bottom: 10px;">💼 Business Model</h4>
                <p><strong>Ownership:</strong> ${schema.business_model.ownership}</p>
                <p><strong>Energy Source:</strong> ${schema.business_model.energy_source}</p>
                <p><strong>Operating Hours:</strong> ${schema.site_conditions.operating_hours.type}</p>
            </div>
        </div>
    `;
}

function generateValidationReportHTML(schema, warnings) {
    const completeness = calculateCompleteness(schema);
    
    let html = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h3 style="color: #333; margin-bottom: 15px;">Validation Report</h3>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: #10b981;">✅ All Required Fields Complete</h4>
                <div style="background: white; padding: 15px; border-radius: 6px; margin-top: 10px;">
                    <p style="font-size: 1.2em;"><strong>Completeness: ${completeness.score}%</strong></p>
                    <div style="background: #e0e0e0; height: 20px; border-radius: 10px; margin-top: 10px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #10b981, #059669); height: 100%; width: ${completeness.score}%; transition: width 0.3s;"></div>
                    </div>
                </div>
            </div>
    `;
    
    if (warnings.length > 0) {
        html += `
            <div style="margin-bottom: 20px;">
                <h4 style="color: #f59e0b;">⚠️ Warnings (${warnings.length})</h4>
                <ul style="margin-top: 10px; color: #92400e;">
                    ${warnings.map(w => `<li>${w}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    html += `
            <div>
                <h4 style="color: #667eea;">📊 Data Quality Assessment</h4>
                <ul style="margin-top: 10px;">
                    <li><strong>Location Data:</strong> ${completeness.location ? 'Complete' : 'Incomplete'}</li>
                    <li><strong>Charger Configuration:</strong> ${completeness.chargers ? 'Complete' : 'Incomplete'}</li>
                    <li><strong>Financial Data:</strong> ${completeness.financial ? 'Complete' : 'Incomplete'}</li>
                    <li><strong>Site Conditions:</strong> ${completeness.site ? 'Partial' : 'Complete'}</li>
                    <li><strong>Business Model:</strong> ${completeness.business ? 'Complete' : 'Incomplete'}</li>
                </ul>
            </div>
        </div>
    `;
    
    return html;
}

function calculateCompleteness(schema) {
    let score = 100;
    let checks = {
        location: true,
        chargers: true,
        financial: true,
        site: true,
        business: true
    };
    
    // Check optionals
    if (!schema.location.coordinates.latitude) score -= 5;
    if (!schema.site_conditions.electrical.capacity_known) { score -= 10; checks.site = false; }
    if (!schema.site_conditions.parking.specified) { score -= 5; checks.site = false; }
    if (!schema.financial_parameters.capex.site_wide.grid_connection_known) score -= 5;
    
    return { score, ...checks };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : null;
}

function getNumericValue(id) {
    const value = getValue(id);
    return value ? parseFloat(value) : null;
}

function getChecked(id) {
    const element = document.getElementById(id);
    return element ? element.checked : false;
}

function getRadioValue(name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : null;
}

function clearValidationMessages() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('active');
        el.textContent = '';
    });
    document.querySelectorAll('.error').forEach(el => {
        el.classList.remove('error');
    });
}

// ============================================================================
// ACTION FUNCTIONS
// ============================================================================

function resetForm() {
    if (confirm('Are you sure you want to reset all fields? This cannot be undone.')) {
        document.querySelectorAll('input, select, textarea').forEach(element => {
            if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = element.defaultChecked;
            } else {
                element.value = element.defaultValue || '';
            }
        });
        
        // Reset charger configs
        document.getElementById('chargerConfigs').innerHTML = '';
        chargerConfigCount = 0;
        addChargerConfig();
        
        // Hide output
        document.getElementById('outputCard').style.display = 'none';
        document.getElementById('validationSummary').classList.remove('active');
        document.getElementById('successMessage').classList.remove('active');
    }
}

function loadExample() {
    // Set example values
    document.getElementById('street').value = '123 Electric Avenue';
    document.getElementById('city').value = 'London';
    document.getElementById('postcode').value = 'NW6 7SD';
    document.getElementById('country').value = 'UK';
    document.getElementById('radius').value = '2';
    
    // Set first charger config
    if (document.getElementById('power1')) {
        document.getElementById('power1').value = '150';
        document.getElementById('quantity1').value = '4';
    }
    
    // Financial
    document.getElementById('energyCost').value = '0.15';
    document.getElementById('tariffStandard').value = '0.45';
    document.getElementById('rent').value = '2000';
    document.getElementById('capexHardware').value = '80000';
    document.getElementById('capexInstallation').value = '20000';
    
    // Business
    document.getElementById('ownershipModel').value = 'client_owned';
    document.getElementById('energySource').value = 'grid';
    
    alert('Example configuration loaded! Review and modify as needed.');
}

function copyToClipboard() {
    const jsonText = document.getElementById('jsonOutput').textContent;
    navigator.clipboard.writeText(jsonText).then(() => {
        alert('✅ Configuration copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard. Please copy manually.');
    });
}

async function sendToBackend() {
    if (!generatedSchema) {
        alert('Please validate and generate schema first');
        return;
    }
    
    // This would send to your actual backend
    const API_URL = 'https://web-production-e0c85.up.railway.app/api/v2/analyze-location';
    
    // Show analysis results section
    const resultsCard = document.getElementById('analysisResults');
    const loadingDiv = document.getElementById('analysisLoading');
    const contentDiv = document.getElementById('analysisContent');
    
    resultsCard.style.display = 'block';
    loadingDiv.style.display = 'block';
    contentDiv.style.display = 'none';
    
    // Scroll to results
    resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    try {
        // Transform schema to backend format
        const backendPayload = transformToBackendFormat(generatedSchema);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backendPayload)
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Hide loading, show results
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';
            
            // Display results in UI
            displayAnalysisResults(result);
            
            console.log('✅ Analysis complete!', result);
        } else {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
    } catch (error) {
        loadingDiv.style.display = 'none';
        contentDiv.style.display = 'block';
        
        // Show error in UI
        displayErrorResults(error.message);
        console.error('Backend error:', error);
    }
}

function transformToBackendFormat(schema) {
    // Transform the generated schema to match your backend's expected format
    return {
        location: {
            postcode: schema.location.address.postcode,
            lat: schema.location.coordinates.latitude,
            lon: schema.location.coordinates.longitude
        },
        radius_km: schema.location.analysis_radius_km,
        planned_installation: {
            charger_type: schema.planned_installation.chargers[0].charger_type,
            power_per_plug_kw: schema.planned_installation.chargers[0].power_kw,
            plugs: schema.planned_installation.total_chargers
        },
        financial_params: {
            energy_cost_per_kwh: schema.financial_parameters.opex.energy.purchase_price_per_kwh,
            tariff_per_kwh: schema.financial_parameters.opex.tariffs.standard,
            fixed_costs_per_month: schema.financial_parameters.opex.fixed_costs.total_monthly_opex
        },
        options: {
            include_raw_sources: true
        }
    };
}

// ============================================================================
// RESULTS DISPLAY FUNCTIONS
// ============================================================================

function displayAnalysisResults(data) {
    console.log('Displaying results:', data);
    
    // Store for later use
    window.analysisData = data;
    
    // Hero Verdict
    displayHeroVerdict(data);
    
    // Score Cards
    displayScoreCards(data);
    
    // Financial Summary
    displayFinancialSummary(data);
    
    // Competition Analysis
    displayCompetitionAnalysis(data);
    
    // Financial Details
    displayFinancialDetails(data);
    
    // Recommendations
    displayRecommendations(data);
    
    // Raw Data
    displayRawData(data);
}

function displayHeroVerdict(data) {
    const verdict = data.verdict || 'Unknown';
    const score = data.overall_score || 0;
    const headline = data.summary?.headline_recommendation || '';
    
    // Set verdict styling
    const heroDiv = document.getElementById('heroVerdict');
    const emojiSpan = document.getElementById('verdictEmoji');
    const textH2 = document.getElementById('verdictText');
    const subtextP = document.getElementById('verdictSubtext');
    const scoreSpan = document.getElementById('overallScore');
    
    // Verdict-specific styling
    if (verdict === 'Strongly Recommended' || verdict === 'Recommended') {
        heroDiv.style.background = 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
        emojiSpan.textContent = '✅';
        textH2.style.color = '#065f46';
    } else if (verdict === 'Conditional' || verdict === 'Consider with Caution') {
        heroDiv.style.background = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
        emojiSpan.textContent = '⚠️';
        textH2.style.color = '#92400e';
    } else {
        heroDiv.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
        emojiSpan.textContent = '❌';
        textH2.style.color = '#991b1b';
    }
    
    textH2.textContent = verdict;
    subtextP.textContent = headline;
    scoreSpan.textContent = score;
}

function displayScoreCards(data) {
    // Demand
    const demandScore = data.demand?.score || 0;
    document.getElementById('demandScore').textContent = demandScore;
    document.getElementById('demandLabel').textContent = getScoreLabel(demandScore);
    document.getElementById('demandScore').style.color = getScoreColor(demandScore);
    
    const demandDetails = [];
    if (data.demand?.ev_density_per_1000_cars) {
        demandDetails.push(`EV Density: ${data.demand.ev_density_per_1000_cars.toFixed(1)}/1000`);
    }
    if (data.demand?.avg_daily_traffic) {
        demandDetails.push(`Daily Traffic: ${data.demand.avg_daily_traffic.toLocaleString()}`);
    }
    document.getElementById('demandDetails').innerHTML = demandDetails.join('<br>');
    
    // Competition
    const compScore = data.competition?.score || 0;
    document.getElementById('competitionScore').textContent = compScore;
    document.getElementById('competitionLabel').textContent = getScoreLabel(compScore);
    document.getElementById('competitionScore').style.color = getScoreColor(compScore);
    
    const compDetails = [];
    if (data.competition?.nearby_chargers !== undefined) {
        compDetails.push(`Nearby Chargers: ${data.competition.nearby_chargers}`);
    }
    if (data.competition?.competition_density !== undefined) {
        compDetails.push(`Density: ${data.competition.competition_density.toFixed(2)}/km²`);
    }
    document.getElementById('competitionDetails').innerHTML = compDetails.join('<br>');
    
    // Grid
    const gridScore = data.grid?.score || 0;
    document.getElementById('gridScore').textContent = gridScore;
    document.getElementById('gridLabel').textContent = getScoreLabel(gridScore);
    document.getElementById('gridScore').style.color = getScoreColor(gridScore);
    
    const gridDetails = [];
    if (data.grid?.required_capacity_kw) {
        gridDetails.push(`Required: ${data.grid.required_capacity_kw} kW`);
    }
    if (data.grid?.feasibility_status) {
        gridDetails.push(`Status: ${data.grid.feasibility_status}`);
    }
    document.getElementById('gridDetails').innerHTML = gridDetails.join('<br>');
    
    // Confidence
    const confidence = Math.round((data.confidence || 0) * 100);
    document.getElementById('confidenceScore').textContent = confidence + '%';
    document.getElementById('confidenceScore').style.color = confidence >= 80 ? '#10b981' : confidence >= 60 ? '#f59e0b' : '#dc2626';
    
    const confDetails = [];
    if (data.data_quality_score) {
        confDetails.push(`Quality Score: ${data.data_quality_score}/10`);
    }
    document.getElementById('confidenceDetails').innerHTML = confDetails.join('<br>');
}

function displayFinancialSummary(data) {
    const financials = data.financials || {};
    
    document.getElementById('totalCapex').textContent = financials.capex || '€0';
    document.getElementById('annualRevenue').textContent = financials.annual_revenue || '€0';
    
    const profit = financials.annual_profit || '€0';
    const profitEl = document.getElementById('annualProfit');
    profitEl.textContent = profit;
    profitEl.style.color = profit.includes('-') ? '#dc2626' : '#10b981';
    
    const roiValue = financials.roi || '0%';
    const roiEl = document.getElementById('roi');
    roiEl.textContent = roiValue;
    roiEl.style.color = roiValue.includes('-') ? '#dc2626' : '#10b981';
    
    const payback = financials.payback_years || 'N/A';
    document.getElementById('payback').textContent = payback === 999 || payback === '999' ? 'Not viable' : payback;
}

function displayCompetitionAnalysis(data) {
    const div = document.getElementById('competitionAnalysis');
    
    let html = '<div style="background: white; padding: 20px; border-radius: 8px;">';
    html += '<h3 style="color: #333; margin-bottom: 20px;">🏆 Competition Breakdown</h3>';
    
    // Nearby chargers
    if (data.competition?.nearby_chargers !== undefined) {
        html += `<div style="margin-bottom: 20px;">
            <strong>Total Nearby Chargers:</strong> ${data.competition.nearby_chargers} 
            <span style="color: #666;">(within ${data.location?.radius_km || 1}km)</span>
        </div>`;
    }
    
    // Power level breakdown
    if (data.competitive_gaps?.power_level_analysis) {
        html += '<h4 style="color: #667eea; margin: 20px 0 10px 0;">Power Level Analysis</h4>';
        html += '<table style="width: 100%; border-collapse: collapse;">';
        html += '<tr style="background: #f8f9fa;"><th style="padding: 10px; text-align: left;">Power Level</th><th style="padding: 10px; text-align: center;">Existing Chargers</th><th style="padding: 10px; text-align: center;">Gap</th><th style="padding: 10px; text-align: left;">Status</th></tr>';
        
        for (const [power, analysis] of Object.entries(data.competitive_gaps.power_level_analysis)) {
            const gapColor = analysis.gap_percentage > 50 ? '#10b981' : analysis.gap_percentage > 0 ? '#f59e0b' : '#dc2626';
            const status = analysis.is_blue_ocean ? '🌊 Blue Ocean' : analysis.gap_percentage > 0 ? '📈 Opportunity' : '🚫 Saturated';
            
            html += `<tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 10px;"><strong>${power} kW</strong></td>
                <td style="padding: 10px; text-align: center;">${analysis.existing_chargers}</td>
                <td style="padding: 10px; text-align: center; color: ${gapColor}; font-weight: 600;">${analysis.gap_percentage.toFixed(0)}%</td>
                <td style="padding: 10px;">${status}</td>
            </tr>`;
        }
        
        html += '</table>';
    }
    
    // Blue Ocean opportunities
    if (data.blue_ocean_opportunities && data.blue_ocean_opportunities.length > 0) {
        html += '<h4 style="color: #667eea; margin: 20px 0 10px 0;">🌊 Blue Ocean Opportunities</h4>';
        html += '<div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">';
        data.blue_ocean_opportunities.forEach(opp => {
            html += `<p style="margin-bottom: 10px;"><strong>${opp.power_kw} kW:</strong> ${opp.description}</p>`;
        });
        html += '</div>';
    }
    
    html += '</div>';
    div.innerHTML = html;
}

function displayFinancialDetails(data) {
    const div = document.getElementById('financialDetails');
    const financials = data.financials || {};
    
    let html = '<div style="background: white; padding: 20px; border-radius: 8px;">';
    html += '<h3 style="color: #333; margin-bottom: 20px;">💰 Detailed Financial Breakdown</h3>';
    
    // CAPEX
    html += '<div style="margin-bottom: 30px;">';
    html += '<h4 style="color: #667eea; margin-bottom: 15px;">Capital Expenditure (CAPEX)</h4>';
    html += '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">';
    html += `<p><strong>Total CAPEX:</strong> ${financials.capex || '€0'}</p>`;
    if (financials.capex_breakdown) {
        for (const [key, value] of Object.entries(financials.capex_breakdown)) {
            html += `<p style="color: #666; margin-left: 20px;">• ${key}: ${value}</p>`;
        }
    }
    html += '</div></div>';
    
    // OPEX
    html += '<div style="margin-bottom: 30px;">';
    html += '<h4 style="color: #667eea; margin-bottom: 15px;">Operating Expenditure (OPEX)</h4>';
    html += '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">';
    html += `<p><strong>Monthly OPEX:</strong> ${financials.monthly_opex || '€0'}</p>`;
    html += `<p><strong>Annual OPEX:</strong> ${financials.annual_opex || '€0'}</p>`;
    if (financials.opex_breakdown) {
        for (const [key, value] of Object.entries(financials.opex_breakdown)) {
            html += `<p style="color: #666; margin-left: 20px;">• ${key}: ${value}</p>`;
        }
    }
    html += '</div></div>';
    
    // Revenue
    html += '<div style="margin-bottom: 30px;">';
    html += '<h4 style="color: #667eea; margin-bottom: 15px;">Revenue Projections</h4>';
    html += '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">';
    
    if (data.session_projections) {
        html += '<p style="margin-bottom: 10px;"><strong>Expected Sessions per Day:</strong></p>';
        html += `<p style="margin-left: 20px;">• Low: ${data.session_projections.low_sessions}/day</p>`;
        html += `<p style="margin-left: 20px;">• Central: ${data.session_projections.central_sessions}/day</p>`;
        html += `<p style="margin-left: 20px;">• High: ${data.session_projections.high_sessions}/day</p>`;
    }
    
    html += `<p style="margin-top: 15px;"><strong>Annual Revenue:</strong> ${financials.annual_revenue || '€0'}</p>`;
    html += `<p><strong>Annual Profit:</strong> <span style="color: ${(financials.annual_profit || '').includes('-') ? '#dc2626' : '#10b981'}; font-weight: 600;">${financials.annual_profit || '€0'}</span></p>`;
    html += '</div></div>';
    
    // ROI Metrics
    html += '<div>';
    html += '<h4 style="color: #667eea; margin-bottom: 15px;">ROI Metrics</h4>';
    html += '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">';
    html += `<p><strong>ROI:</strong> ${financials.roi || '0%'}</p>`;
    html += `<p><strong>Payback Period:</strong> ${financials.payback_years === 999 ? 'Not viable' : financials.payback_years || 'N/A'}</p>`;
    html += `<p><strong>NPV (5 years):</strong> ${financials.npv_5_years || '€0'}</p>`;
    html += '</div></div>';
    
    html += '</div>';
    div.innerHTML = html;
}

function displayRecommendations(data) {
    const div = document.getElementById('recommendationsContent');
    
    let html = '<div style="background: white; padding: 20px; border-radius: 8px;">';
    
    // Key Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
        html += '<h3 style="color: #333; margin-bottom: 20px;">📋 Key Recommendations</h3>';
        html += '<ul style="list-style: none; padding: 0;">';
        data.recommendations.forEach(rec => {
            html += `<li style="background: #f8f9fa; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #667eea;">
                ${rec}
            </li>`;
        });
        html += '</ul>';
    }
    
    // Strategic Opportunities
    if (data.strategic_opportunities && data.strategic_opportunities.length > 0) {
        html += '<h3 style="color: #333; margin: 30px 0 20px 0;">🎯 Strategic Opportunities</h3>';
        data.strategic_opportunities.forEach(opp => {
            html += `<div style="background: #f0fdf4; padding: 20px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
                <h4 style="color: #065f46; margin-bottom: 10px;">${opp.title || opp.opportunity}</h4>
                <p style="color: #064e3b; margin-bottom: 10px;">${opp.description || opp.rationale}</p>
                ${opp.action_plan ? `<p style="color: #065f46;"><strong>Action:</strong> ${opp.action_plan}</p>` : ''}
            </div>`;
        });
    }
    
    // Risks
    if (data.risks && data.risks.length > 0) {
        html += '<h3 style="color: #333; margin: 30px 0 20px 0;">⚠️ Potential Risks</h3>';
        html += '<ul style="list-style: none; padding: 0;">';
        data.risks.forEach(risk => {
            html += `<li style="background: #fef3c7; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                ${risk}
            </li>`;
        });
        html += '</ul>';
    }
    
    // Next Steps
    if (data.next_steps && data.next_steps.length > 0) {
        html += '<h3 style="color: #333; margin: 30px 0 20px 0;">👉 Next Steps</h3>';
        html += '<ol style="padding-left: 20px;">';
        data.next_steps.forEach(step => {
            html += `<li style="margin-bottom: 10px; color: #333;">${step}</li>`;
        });
        html += '</ol>';
    }
    
    html += '</div>';
    div.innerHTML = html;
}

function displayRawData(data) {
    document.getElementById('rawDataOutput').textContent = JSON.stringify(data, null, 2);
}

function displayErrorResults(errorMessage) {
    const heroDiv = document.getElementById('heroVerdict');
    heroDiv.innerHTML = `
        <div style="font-size: 4em; margin-bottom: 15px;">❌</div>
        <h2 style="font-size: 2em; margin-bottom: 10px; color: #991b1b;">Analysis Failed</h2>
        <p style="font-size: 1.2em; opacity: 0.9; color: #991b1b;">${errorMessage}</p>
        <div style="margin-top: 20px;">
            <button class="btn-secondary" onclick="resetAndStartNew()">Try Again</button>
        </div>
    `;
    heroDiv.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
}

function getScoreLabel(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Weak';
    return 'Poor';
}

function getScoreColor(score) {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    if (score >= 20) return '#f97316';
    return '#dc2626';
}

function showResultTab(tabId) {
    // Hide all result tabs
    document.querySelectorAll('#analysisContent .tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all tabs
    document.querySelectorAll('#analysisContent .tabs .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

function copyRawData() {
    const jsonText = document.getElementById('rawDataOutput').textContent;
    navigator.clipboard.writeText(jsonText).then(() => {
        alert('✅ Raw data copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard. Please copy manually.');
    });
}

function exportPDF() {
    alert('📄 PDF export feature coming soon! For now, use browser print (Ctrl/Cmd+P)');
    window.print();
}

function resetAndStartNew() {
    if (confirm('Start a new analysis? Current results will be lost.')) {
        document.getElementById('analysisResults').style.display = 'none';
        document.getElementById('outputCard').style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function shareResults() {
    if (window.analysisData) {
        const shareUrl = `${window.location.origin}${window.location.pathname}?results=${btoa(JSON.stringify(window.analysisData))}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('✅ Share link copied to clipboard!');
        }).catch(() => {
            alert('Share feature: Copy this URL to share results\n\n' + shareUrl);
        });
    } else {
        alert('No results to share');
    }
}

// ============================================================================
// EXPORT
// ============================================================================

console.log('EVL Configuration System v2.0 Ready');
