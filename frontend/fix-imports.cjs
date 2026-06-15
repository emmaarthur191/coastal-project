const fs = require('fs');
const files = [
  'src/pages/BankingOperations.tsx', 
  'src/pages/CashierDashboard.tsx', 
  'src/pages/FraudAlerts.tsx', 
  'src/pages/OperationsManagerDashboard.tsx', 
  'src/pages/Reports.tsx', 
  'src/pages/Transfer.tsx'
];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/import\s+(?:type\s+)?{([^}]+)}\s+from\s+['"](?:\.\.\/)+api\/models\/[^'"]+['"];/g, "import type { $1 } from '../api/types.gen';");
  fs.writeFileSync(f, c);
});
console.log('Imports fixed.');
