
export const dateFormatterHour = new Intl.DateTimeFormat('pt-AO');

export const dateFormatter = new Intl.DateTimeFormat('pt-AO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export const priceFormatter = new Intl.NumberFormat('pt-AO', {
  style: 'currency',
  currency: 'AOA',
});

export function formatGlucose(glucose:number) {
  return glucose.toLocaleString('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }) + ' mg/dL';
}

export function formatBloodPressure(bp:number) {
  return bp.toLocaleString('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }) + ' mmHg';
}

export function formatCholesterol(cholesterol:number) {
  return cholesterol.toLocaleString('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' mg/dL';
}

export function formatTriglycerides(triglycerides:number) {
  return triglycerides.toLocaleString('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }) + ' mg/dL';
}






