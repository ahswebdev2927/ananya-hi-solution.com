const fs = require('fs');

// 1. Update Header.js
let header = fs.readFileSync('src/app/components/Header.js', 'utf8');
header = header.replace('import React, { useState, useEffect } from "react";', 'import React, { useState, useEffect } from "react";\nimport { useServices } from "../context/ServicesContext";');

// In Header component signature
header = header.replace('export default function Header({ activePage = "" }) {', 'export default function Header({ activePage = "" }) {\n  const { services } = useServices();');

// Replace desktop dropdown menu
const desktopStart = header.indexOf('<ul className="dropdown-menu">');
const desktopEnd = header.indexOf('</ul>', desktopStart) + 5;
if (desktopStart !== -1) {
    header = header.slice(0, desktopStart) + `<ul className="dropdown-menu">
              {services.map((svc) => (
                <li key={svc.id}><Link href={\`/services/\${svc.id}\`}>{svc.title}</Link></li>
              ))}
            </ul>` + header.slice(desktopEnd);
}

// Replace mobile dropdown menu
const mobileStart = header.indexOf('<div className="flex flex-col gap-2 pl-4 pt-2">');
const mobileEnd = header.indexOf('</div>', mobileStart) + 6;
if (mobileStart !== -1) {
    header = header.slice(0, mobileStart) + `<div className="flex flex-col gap-2 pl-4 pt-2">
                {services.map((svc) => (
                  <Link key={svc.id} href={\`/services/\${svc.id}\`} onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600 hover:text-primary-blue">{svc.title}</Link>
                ))}
              </div>` + header.slice(mobileEnd);
}

fs.writeFileSync('src/app/components/Header.js', header, 'utf8');
console.log('Updated Header.js');


// 2. Update GlobalFooter.js
let footer = fs.readFileSync('src/app/components/GlobalFooter.js', 'utf8');
footer = footer.replace('import React, { useState, useEffect, useRef } from "react";', 'import React, { useState, useEffect, useRef } from "react";\nimport { useServices } from "../context/ServicesContext";');

footer = footer.replace('export default function GlobalFooter() {', 'export default function GlobalFooter() {\n  const { services } = useServices();');

const footerStart = footer.indexOf('<ul className="footer-links" style={{ display: \'grid\', gridTemplateColumns: \'1fr 1fr\', columnGap: \'1rem\' }}>');
const footerEnd = footer.indexOf('</ul>', footerStart) + 5;
if (footerStart !== -1) {
    footer = footer.slice(0, footerStart) + `<ul className="footer-links" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '1rem' }}>
              {services.map((svc) => (
                <li key={svc.id}><Link href={\`/services/\${svc.id}\`}>{svc.title}</Link></li>
              ))}
            </ul>` + footer.slice(footerEnd);
}

fs.writeFileSync('src/app/components/GlobalFooter.js', footer, 'utf8');
console.log('Updated GlobalFooter.js');


// 3. Update page.js
let page = fs.readFileSync('src/app/page.js', 'utf8');
page = page.replace('import React, { useState, useEffect, useRef } from "react";', 'import React, { useState, useEffect, useRef } from "react";\nimport { useServices } from "./context/ServicesContext";');

// Remove the local fetching logic
page = page.replace(/  \/\/ ----------------------------------------------------\n  \/\/ DYNAMIC FETCH STATES\n  \/\/ ----------------------------------------------------\n  const \[services, setServices\] = useState\(\[\]\);\n\n  \/\/ Fetch dynamic content on mount\n  useEffect\(\(\) => {\n    const fetchHomepageData = async \(\) => {\n      try {\n        const resServices = await fetch\("\/api\/services"\);\n\n        if \(resServices\.ok\) {\n          const dataServices = await resServices\.json\(\);\n          setServices\(dataServices\);\n        }\n      } catch \(err\) {\n        console\.error\("Failed to load dynamic database components:", err\);\n      }\n    };\n\n    fetchHomepageData\(\);\n  }, \[\]\);\n/g, '  const { services, isLoading } = useServices();\n');

// Replace the spinner logic check length to isLoading
page = page.replace('{services.length === 0 ? (', '{isLoading ? (');

fs.writeFileSync('src/app/page.js', page, 'utf8');
console.log('Updated page.js');
