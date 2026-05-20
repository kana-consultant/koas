use serde::{Deserialize, Serialize};
use std::cmp::Ordering;

const DEFAULT_PAGE_SIZE: u32 = 20;
const MAX_PAGE_SIZE: u32 = 200;

#[derive(Debug, Clone, Deserialize)]
pub struct ListParams {
    #[serde(default)]
    pub page: Option<u32>,
    #[serde(default)]
    pub page_size: Option<u32>,
    #[serde(default)]
    pub sort: Option<String>,
    #[serde(default)]
    pub search: Option<String>,
}

impl ListParams {
    pub fn page(&self) -> u32 {
        self.page.unwrap_or(1).max(1)
    }

    pub fn page_size(&self) -> u32 {
        self.page_size
            .unwrap_or(DEFAULT_PAGE_SIZE)
            .clamp(1, MAX_PAGE_SIZE)
    }

    pub fn search_term(&self) -> Option<&str> {
        self.search
            .as_deref()
            .map(str::trim)
            .filter(|s| !s.is_empty())
    }

    pub fn sort(&self) -> Option<SortSpec<'_>> {
        let raw = self.sort.as_deref()?.trim();
        if raw.is_empty() {
            return None;
        }
        let (field, dir) = match raw.split_once(':') {
            Some((f, d)) => (f.trim(), d.trim()),
            None => (raw, "asc"),
        };
        if field.is_empty() {
            return None;
        }
        let direction = if dir.eq_ignore_ascii_case("desc") {
            SortDirection::Desc
        } else {
            SortDirection::Asc
        };
        Some(SortSpec { field, direction })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SortDirection {
    Asc,
    Desc,
}

#[derive(Debug, Clone, Copy)]
pub struct SortSpec<'a> {
    pub field: &'a str,
    pub direction: SortDirection,
}

impl SortSpec<'_> {
    pub fn apply<T: Ord>(&self, a: T, b: T) -> Ordering {
        match self.direction {
            SortDirection::Asc => a.cmp(&b),
            SortDirection::Desc => b.cmp(&a),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct Page<T: Serialize> {
    pub items: Vec<T>,
    pub total: u64,
    pub page: u32,
    pub page_size: u32,
}

impl<T: Serialize> Page<T> {
    pub fn paginate<F, S>(
        mut rows: Vec<T>,
        params: &ListParams,
        matches: F,
        compare: S,
    ) -> Self
    where
        F: Fn(&T, &str) -> bool,
        S: Fn(&T, &T, SortSpec<'_>) -> Ordering,
    {
        if let Some(term) = params.search_term() {
            let needle = term.to_lowercase();
            rows.retain(|row| matches(row, &needle));
        }
        if let Some(spec) = params.sort() {
            rows.sort_by(|a, b| compare(a, b, spec));
        }
        let total = rows.len() as u64;
        let page = params.page();
        let page_size = params.page_size();
        let start = ((page - 1) as usize).saturating_mul(page_size as usize);
        let end = start.saturating_add(page_size as usize).min(rows.len());
        let items = if start >= rows.len() {
            Vec::new()
        } else {
            rows.drain(start..end).collect()
        };
        Page { items, total, page, page_size }
    }
}
