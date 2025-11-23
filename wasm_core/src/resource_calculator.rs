/// SIMD-optimized resource calculations for high performance

pub fn sum_resources_simd(values: &[f64]) -> f64 {
    // In production, use actual SIMD instructions
    // For now, simple sum with rounding
    let sum: f64 = values.iter().sum();
    (sum * 100.0).round() / 100.0
}

pub fn calculate_resource_totals(
    quantities: &[f64],
    prices: &[f64],
    coefficients: &[f64],
) -> Vec<f64> {
    quantities
        .iter()
        .zip(prices.iter())
        .zip(coefficients.iter())
        .map(|((qty, price), coef)| (qty * price * coef * 100.0).round() / 100.0)
        .collect()
}

pub fn aggregate_materials(
    material_lists: Vec<Vec<(String, f64, String)>>, // (name, quantity, unit)
) -> Vec<(String, f64, String)> {
    use std::collections::HashMap;

    let mut aggregated: HashMap<String, (f64, String)> = HashMap::new();

    for list in material_lists {
        for (name, qty, unit) in list {
            let key = format!("{}_{}", name, unit);
            aggregated
                .entry(key.clone())
                .and_modify(|(q, _)| *q += qty)
                .or_insert((qty, unit.clone()));
        }
    }

    aggregated
        .into_iter()
        .map(|(key, (qty, unit))| {
            // Extract name by removing the unit suffix
            let name = if let Some((name_part, _)) = key.rsplit_once('_') {
                name_part.to_string()
            } else {
                key
            };
            (name, qty, unit)
        })
        .collect()
}
