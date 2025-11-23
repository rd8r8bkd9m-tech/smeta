use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Norm {
    pub code: String,
    pub name: String,
    pub unit: String,
    pub base_price: f64,
    pub labor_hours: f64,
    pub materials: Vec<MaterialNorm>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MaterialNorm {
    pub name: String,
    pub unit: String,
    pub quantity: f64,
    pub price: f64,
}

pub struct NormLoader {
    norms: Vec<Norm>,
}

impl NormLoader {
    pub fn new() -> Self {
        NormLoader { norms: vec![] }
    }

    pub fn load_from_binary(&mut self, data: &[u8]) -> Result<(), String> {
        // In production, implement efficient binary format parsing
        // For now, assume JSON format
        let json_str = std::str::from_utf8(data).map_err(|e| e.to_string())?;
        self.norms = serde_json::from_str(json_str).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn find_by_code(&self, code: &str) -> Option<&Norm> {
        self.norms.iter().find(|n| n.code == code)
    }

    pub fn search(&self, query: &str) -> Vec<&Norm> {
        let query_lower = query.to_lowercase();
        self.norms
            .iter()
            .filter(|n| {
                n.code.to_lowercase().contains(&query_lower)
                    || n.name.to_lowercase().contains(&query_lower)
            })
            .collect()
    }
}
