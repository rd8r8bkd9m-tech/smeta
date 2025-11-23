use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

mod calculation;
mod norm_loader;
mod resource_calculator;

pub use calculation::*;
pub use norm_loader::*;
pub use resource_calculator::*;

/// Initialize WASM module
#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// EstimateItem structure
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct EstimateItem {
    quantity: f64,
    unit_price: f64,
    coefficients: Vec<f64>,
}

#[wasm_bindgen]
pub fn create_estimate_item(quantity: f64, unit_price: f64) -> JsValue {
    let item = EstimateItem {
        quantity,
        unit_price,
        coefficients: vec![],
    };
    serde_wasm_bindgen::to_value(&item).unwrap()
}

#[wasm_bindgen]
pub fn calculate_item_total(quantity: f64, unit_price: f64, coefficients: Vec<f64>) -> f64 {
    let mut total = quantity * unit_price;
    for coef in coefficients {
        total *= coef;
    }
    (total * 100.0).round() / 100.0
}

/// Fast calculation of estimate totals
#[wasm_bindgen]
pub fn calculate_estimate_total(items_json: &str) -> Result<f64, JsValue> {
    let items: Vec<EstimateItem> = serde_json::from_str(items_json)
        .map_err(|e| JsValue::from_str(&format!("Parse error: {}", e)))?;

    let total: f64 = items.iter().map(|item| {
        let mut item_total = item.quantity * item.unit_price;
        for coef in &item.coefficients {
            item_total *= coef;
        }
        item_total
    }).sum();
    
    Ok((total * 100.0).round() / 100.0)
}

/// Apply regional coefficient to price
#[wasm_bindgen]
pub fn apply_regional_coefficient(price: f64, coefficient: f64) -> f64 {
    (price * coefficient * 100.0).round() / 100.0
}

/// Calculate material with waste
#[wasm_bindgen]
pub fn calculate_material_with_waste(quantity: f64, waste_coef: f64) -> f64 {
    (quantity * waste_coef * 100.0).round() / 100.0
}

/// Calculate labor hours
#[wasm_bindgen]
pub fn calculate_labor_hours(quantity: f64, norm_hours: f64, difficulty_coef: f64) -> f64 {
    (quantity * norm_hours * difficulty_coef * 100.0).round() / 100.0
}

/// Apply price index for recalculation
#[wasm_bindgen]
pub fn apply_price_index(base_price: f64, base_year: i32, target_year: i32) -> f64 {
    let yearly_inflation = 1.07;
    let years = (target_year - base_year) as f64;
    (base_price * yearly_inflation.powf(years) * 100.0).round() / 100.0
}
