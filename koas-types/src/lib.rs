use serde::Serialize;

#[derive(Serialize)]
pub struct SingleResponse<T: Serialize> {
    pub data: T,
    pub message: String,
}

impl<T: Serialize> SingleResponse<T> {
    pub fn new(data: T, message: impl Into<String>) -> Self {
        Self {
            data,
            message: message.into(),
        }
    }
}

#[derive(Serialize)]
pub struct ListResponse<T: Serialize> {
    pub data: Vec<T>,
    pub total: usize,
}

impl<T: Serialize> ListResponse<T> {
    pub fn new(data: Vec<T>) -> Self {
        let total = data.len();
        Self { data, total }
    }
}
