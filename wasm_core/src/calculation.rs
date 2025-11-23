/// Advanced calculation functions for construction estimates

pub fn calculate_position_cost(
    quantity: f64,
    base_rate: f64,
    coefficients: &[f64],
) -> f64 {
    let mut cost = quantity * base_rate;
    for coef in coefficients {
        cost *= coef;
    }
    (cost * 100.0).round() / 100.0
}

pub fn calculate_materials_cost(
    materials: &[(f64, f64, f64)], // (quantity, price, waste_coef)
) -> f64 {
    materials
        .iter()
        .map(|(qty, price, waste)| qty * waste * price)
        .sum::<f64>()
}

pub fn calculate_overhead_costs(direct_costs: f64, overhead_rate: f64) -> f64 {
    (direct_costs * overhead_rate * 100.0).round() / 100.0
}

pub fn calculate_profit(total_costs: f64, profit_rate: f64) -> f64 {
    (total_costs * profit_rate * 100.0).round() / 100.0
}
