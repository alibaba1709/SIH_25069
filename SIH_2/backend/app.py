#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RE-SOURCE - Flask API Backend for MCI Calculations
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CircularityAI:
    """
    RE-SOURCE Model for MCI and Environmental Impact Calculations
    """
    
    def __init__(self):
        logger.info("Initializing CircularityAI model...")
    
    def calculate_mci(self, data):
        """
        Calculate Material Circularity Index (MCI) based on input parameters
        """
        try:
            # Extract key parameters
            recycled_content = data.get('recycled_content_frac', 0)
            recycling_efficiency = data.get('recycling_efficiency_frac', 0)
            product_lifetime = data.get('product_lifetime_years', 1)
            renewable_fraction = data.get('renewable_electricity_frac', 0)
            reuse_score = data.get('reuse_potential_score', 0)
            repair_score = data.get('repairability_score', 0)
            
            # Enhanced MCI calculation with weighted factors
            circularity_factors = {
                'recycled_content': recycled_content * 25,  # 25% weight
                'recycling_efficiency': recycling_efficiency * 20,  # 20% weight
                'product_lifetime': min(product_lifetime / 10, 1) * 20,  # 20% weight, normalized
                'renewable_energy': renewable_fraction * 15,  # 15% weight
                'reuse_potential': reuse_score * 10,  # 10% weight
                'repairability': repair_score * 10,  # 10% weight
            }
            
            # Calculate weighted MCI
            mci_score = sum(circularity_factors.values())
            
            # Add bonus for exceptional performance
            if recycled_content > 0.8 and recycling_efficiency > 0.8:
                mci_score += 5  # Bonus for high circularity
                
            # Ensure MCI is between 0-100
            mci_score = max(0, min(100, mci_score))
            
            return mci_score, circularity_factors
            
        except Exception as e:
            logger.error(f"Error calculating MCI: {str(e)}")
            return 0, {}
    
    def calculate_environmental_impact(self, data):
        """
        Calculate environmental impacts (CO2, Energy, Water)
        """
        try:
            # Base impact factors by material
            material_impacts = {
                'Steel': {'co2': 2.3, 'energy': 25, 'water': 15},
                'Aluminum': {'co2': 10.0, 'energy': 150, 'water': 50},
                'Copper': {'co2': 3.5, 'energy': 40, 'water': 25},
            }
            
            material = data.get('material', 'Steel')
            route = data.get('route', 'Primary')
            quantity = data.get('quantity', 1)
            
            # Get base impacts
            base_impacts = material_impacts.get(material, material_impacts['Steel'])
            
            # Apply route multiplier (recycled materials have lower impact)
            route_multiplier = 0.1 if route == 'Secondary' else 1.0
            
            # Calculate transport emissions
            transport_distance = data.get('transport_distance_km', 100)
            transport_emissions = transport_distance * 0.0001  # kg CO2 per km
            
            # Calculate final impacts
            co2_emissions = (base_impacts['co2'] * route_multiplier + transport_emissions) * quantity
            energy_consumption = base_impacts['energy'] * route_multiplier * quantity
            water_usage = base_impacts['water'] * route_multiplier * quantity
            
            # Apply renewable energy reduction
            renewable_fraction = data.get('renewable_electricity_frac', 0)
            energy_reduction = energy_consumption * renewable_fraction * 0.3
            co2_reduction = co2_emissions * renewable_fraction * 0.2
            
            return {
                'co2_emissions': max(0, co2_emissions - co2_reduction),
                'energy_consumption': max(0, energy_consumption - energy_reduction),
                'water_usage': water_usage,
                'transport_emissions': transport_emissions
            }
            
        except Exception as e:
            logger.error(f"Error calculating environmental impact: {str(e)}")
            return {'co2_emissions': 0, 'energy_consumption': 0, 'water_usage': 0, 'transport_emissions': 0}
    
    def get_recommendations(self, mci_score, data):
        """
        Generate recommendations based on MCI score and input parameters
        """
        recommendations = []
        
        try:
            recycled_content = data.get('recycled_content_frac', 0)
            recycling_efficiency = data.get('recycling_efficiency_frac', 0)
            renewable_fraction = data.get('renewable_electricity_frac', 0)
            product_lifetime = data.get('product_lifetime_years', 1)
            
            if mci_score < 40:
                recommendations.extend([
                    "🔄 Increase recycled content to above 50% to significantly improve circularity",
                    "⚡ Transition to renewable energy sources (current: {:.1f}%)".format(renewable_fraction * 100),
                    "🔧 Improve product design for longer lifetime and better repairability",
                    "♻️ Establish better end-of-life material recovery systems"
                ])
            elif 40 <= mci_score < 70:
                recommendations.extend([
                    "📈 Optimize recycling efficiency (current: {:.1f}%)".format(recycling_efficiency * 100),
                    "🌱 Increase renewable energy usage to 80%+ for better sustainability",
                    "🔄 Improve material loop closing to reduce waste",
                    "📊 Monitor and track circularity metrics regularly"
                ])
            else:
                recommendations.extend([
                    "✅ Excellent circularity performance! Maintain current practices",
                    "🎯 Consider becoming a benchmark for industry best practices",
                    "🔬 Explore innovative recycling technologies for further optimization",
                    "📋 Share learnings with industry to promote circular economy"
                ])
            
            # Specific recommendations based on low-performing parameters
            if recycled_content < 0.3:
                recommendations.append("⚠️ Priority: Increase recycled content from {:.1f}% to at least 30%".format(recycled_content * 100))
            
            if renewable_fraction < 0.5:
                recommendations.append("🌿 Priority: Increase renewable energy from {:.1f}% to 50%+".format(renewable_fraction * 100))
                
            if product_lifetime < 5:
                recommendations.append("⏰ Priority: Extend product lifetime from {:.1f} to 5+ years".format(product_lifetime))
                
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            recommendations.append("Unable to generate specific recommendations at this time.")
        
        return recommendations

# Initialize the model
circularity_model = CircularityAI()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'RE-SOURCE API is running'})

@app.route('/api/calculate', methods=['POST'])
def calculate_lca():
    """
    Main LCA calculation endpoint
    """
    try:
        data = request.json
        logger.info(f"Received calculation request: {data}")
        
        # Validate required fields
        required_fields = ['material', 'quantity', 'route']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Calculate MCI
        mci_score, circularity_factors = circularity_model.calculate_mci(data)
        
        # Calculate environmental impacts
        environmental_impacts = circularity_model.calculate_environmental_impact(data)
        
        # Generate recommendations
        recommendations = circularity_model.get_recommendations(mci_score, data)
        
        # Prepare response
        response = {
            'success': True,
            'results': {
                'mci_score': round(mci_score, 1),
                'circularity_factors': {k: round(v, 2) for k, v in circularity_factors.items()},
                'environmental_impacts': {k: round(v, 3) for k, v in environmental_impacts.items()},
                'recommendations': recommendations,
                'material': data['material'],
                'quantity': data['quantity'],
                'route': data['route']
            }
        }
        
        logger.info(f"Calculation completed successfully. MCI: {mci_score:.1f}")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error in calculation: {str(e)}")
        return jsonify({'error': f'Calculation failed: {str(e)}'}), 500

@app.route('/api/materials', methods=['GET'])
def get_materials():
    """Get available materials and their properties"""
    materials = {
        'Steel': {
            'types': ['Structural Steel', 'Stainless Steel', 'Carbon Steel', 'Tool Steel'],
            'typical_lifetime': 25,
            'recycling_rate': 0.85,
            'description': 'Versatile metal with excellent recyclability'
        },
        'Aluminum': {
            'types': ['Pure Aluminum', 'Aluminum Alloy', 'Cast Aluminum', 'Wrought Aluminum'],
            'typical_lifetime': 15,
            'recycling_rate': 0.90,
            'description': 'Lightweight metal with high recycling efficiency'
        },
        'Copper': {
            'types': ['Pure Copper', 'Copper Alloy', 'Brass', 'Bronze'],
            'typical_lifetime': 20,
            'recycling_rate': 0.95,
            'description': 'Highly conductive metal with excellent recyclability'
        }
    }
    return jsonify(materials)

if __name__ == '__main__':
    print("🚀 Starting RE-SOURCE Backend Server...")
    print("📡 API will be available at: http://localhost:5000")
    print("🔗 Frontend should connect to: http://localhost:5000/api/")
    app.run(debug=True, host='0.0.0.0', port=5000)
