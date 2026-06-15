const fs = require('fs');
let c = fs.readFileSync('src/pages/FraudRules.tsx', 'utf8');

c = c.replace(/RuleTypeEnum\.VELOCITY/g, "'velocity'");
c = c.replace(/RuleTypeEnum\.AMOUNT/g, "'amount'");
c = c.replace(/RuleTypeEnum\.LOCATION/g, "'location'");
c = c.replace(/RuleTypeEnum\.BEHAVIOR/g, "'behavior'");
c = c.replace(/RuleTypeEnum\.CUSTOM/g, "'custom'");

c = c.replace(/SeverityEnum\.LOW/g, "'low'");
c = c.replace(/SeverityEnum\.MEDIUM/g, "'medium'");
c = c.replace(/SeverityEnum\.HIGH/g, "'high'");
c = c.replace(/SeverityEnum\.CRITICAL/g, "'critical'");

fs.writeFileSync('src/pages/FraudRules.tsx', c);
console.log('Enums fixed.');
