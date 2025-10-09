const fs = require('fs');
let content = fs.readFileSync('src/app/marketplace/page.tsx', 'utf8');

// Add Suspense to imports
content = content.replace(
  "import { useState, useEffect } from 'react';",
  "import { useState, useEffect, Suspense } from 'react';"
);

// Wrap the export in Suspense
content = content.replace(
  'export default function MarketplacePage()',
  'function MarketplaceContent()'
);

// Add the Suspense wrapper at the end
content = content + `

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading marketplace...</p>
        </div>
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}`;

fs.writeFileSync('src/app/marketplace/page.tsx', content);
console.log('Fixed marketplace with Suspense');
