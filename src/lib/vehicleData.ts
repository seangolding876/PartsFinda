// Vehicle Make and Model data for Jamaica market
export const vehicleMakes = [
  'Toyota', 'Honda', 'Nissan', 'Mazda', 'Mitsubishi', 'Subaru', 'Suzuki',
  'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen',
  'Hyundai', 'Kia', 'Peugeot', 'Renault', 'Fiat', 'Volvo', 'Lexus',
  'Infiniti', 'Acura', 'Land Rover', 'Jeep', 'Dodge', 'RAM', 'GMC'
] as const;

export const vehicleModels: Record<string, string[]> = {
  'Toyota': [
    'Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma', 'Prius', 'Sienna', '4Runner',
    'Avalon', 'C-HR', 'Tundra', 'Sequoia', 'Land Cruiser', 'Venza', 'Yaris',
    'Hilux', 'Fortuner', 'Innova', 'Rush', 'Urban Cruiser'
  ],
  'Honda': [
    'Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'Ridgeline', 'HR-V', 'Fit',
    'Insight', 'Passport', 'Clarity', 'CR-Z', 'Element', 'S2000', 'City',
    'Jazz', 'Vezel', 'WR-V', 'BR-V', 'Mobilio'
  ],
  'Nissan': [
    'Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Frontier', 'Maxima', 'Murano', 'Versa',
    'Armada', 'Kicks', 'Leaf', 'Titan', '370Z', 'GT-R', 'Juke',
    'X-Trail', 'Qashqai', 'Navara', 'Terra', 'Note', 'March', 'Sunny'
  ],
  'Mazda': [
    'CX-5', 'Mazda3', 'CX-30', 'CX-9', 'MX-5 Miata', 'Mazda6', 'CX-50',
    'CX-3', 'Mazda2', 'CX-7', 'CX-8', 'BT-50', 'Tribute', 'RX-8'
  ],
  'Mitsubishi': [
    'Outlander', 'Eclipse Cross', 'Mirage', 'Outlander Sport', 'Pajero', 'L200',
    'ASX', 'Triton', 'Montero', 'Lancer', 'Evolution', 'Galant', 'Delica',
    'Attrage', 'Xpander', 'Strada'
  ],
  'Subaru': [
    'Outback', 'Impreza', 'Crosstrek', 'Forester', 'Legacy', 'Ascent', 'WRX',
    'BRZ', 'Solterra', 'Baja', 'Tribeca', 'XV', 'Levorg', 'STI'
  ],
  'Suzuki': [
    'Swift', 'Vitara', 'Jimny', 'Baleno', 'S-Cross', 'Ignis', 'Alto',
    'Ertiga', 'Ciaz', 'Dzire', 'Wagon R', 'Celerio', 'XL7', 'APV'
  ],
  'Ford': [
    'F-150', 'Explorer', 'Escape', 'Edge', 'Mustang', 'Ranger', 'Bronco',
    'Expedition', 'EcoSport', 'Fusion', 'Focus', 'Fiesta', 'Maverick',
    'Transit', 'E-Series', 'Flex', 'Taurus'
  ],
  'Chevrolet': [
    'Silverado', 'Equinox', 'Traverse', 'Tahoe', 'Malibu', 'Colorado', 'Blazer',
    'Suburban', 'Trailblazer', 'Camaro', 'Corvette', 'Spark', 'Cruze',
    'Impala', 'Volt', 'Bolt', 'Trax', 'Express'
  ],
  'BMW': [
    '3 Series', '5 Series', 'X3', 'X5', 'X1', '7 Series', 'X7', '4 Series',
    '2 Series', 'X2', 'X4', 'X6', '8 Series', 'Z4', 'i4', 'iX',
    '1 Series', '6 Series', 'M3', 'M5', 'M4', 'M2'
  ],
  'Mercedes-Benz': [
    'C-Class', 'E-Class', 'GLC', 'GLE', 'A-Class', 'S-Class', 'GLA',
    'GLB', 'GLS', 'CLA', 'CLS', 'G-Class', 'EQC', 'EQS', 'AMG GT',
    'Sprinter', 'Metris', 'SL', 'SLC', 'GL-Class'
  ],
  'Audi': [
    'A4', 'A6', 'Q5', 'Q7', 'A3', 'Q3', 'Q8', 'A5', 'A7', 'A8',
    'e-tron', 'TT', 'R8', 'RS3', 'RS5', 'RS7', 'S4', 'S5', 'SQ5'
  ],
  'Volkswagen': [
    'Jetta', 'Passat', 'Tiguan', 'Atlas', 'Golf', 'ID.4', 'Taos',
    'Arteon', 'GTI', 'Golf R', 'Beetle', 'CC', 'Touareg', 'Polo',
    'T-Cross', 'T-Roc', 'Amarok', 'Caddy'
  ],
  'Hyundai': [
    'Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Kona', 'Palisade', 'Venue',
    'Accent', 'Veloster', 'Ioniq', 'Nexo', 'Genesis', 'Creta', 'i10',
    'i20', 'i30', 'ix35', 'Starex', 'H1'
  ],
  'Kia': [
    'Forte', 'Optima', 'Sportage', 'Sorento', 'Seltos', 'Telluride', 'Soul',
    'Rio', 'Stinger', 'Carnival', 'K5', 'Niro', 'EV6', 'Picanto',
    'Cerato', 'Stonic', 'Sonet', 'Mohave'
  ],
  'Lexus': [
    'IS', 'ES', 'GS', 'LS', 'NX', 'RX', 'GX', 'LX', 'UX', 'RC',
    'LC', 'CT', 'RZ', 'LM', 'HS'
  ],
  'Infiniti': [
    'Q50', 'Q60', 'QX50', 'QX60', 'QX80', 'Q70', 'QX30', 'QX70',
    'G37', 'M37', 'FX35', 'FX50', 'EX35', 'JX35'
  ],
  'Acura': [
    'TLX', 'RDX', 'MDX', 'ILX', 'NSX', 'Integra', 'TL', 'TSX',
    'RL', 'ZDX', 'RSX', 'CL', 'Legend', 'Vigor'
  ],
  'Land Rover': [
    'Range Rover', 'Range Rover Sport', 'Range Rover Velar', 'Range Rover Evoque',
    'Discovery', 'Discovery Sport', 'Defender', 'Freelander', 'LR2', 'LR3', 'LR4'
  ],
  'Jeep': [
    'Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade', 'Gladiator',
    'Wagoneer', 'Grand Wagoneer', 'Patriot', 'Liberty', 'Commander'
  ],
  'Dodge': [
    'Challenger', 'Charger', 'Durango', 'Journey', 'Grand Caravan', 'RAM',
    'Viper', 'Dart', 'Avenger', 'Caliber', 'Nitro', 'Magnum'
  ],
  'RAM': [
    '1500', '2500', '3500', 'ProMaster', 'ProMaster City', 'Classic',
    'TRX', 'Power Wagon', 'Rebel', 'Laramie', 'Big Horn'
  ],
  'GMC': [
    'Sierra', 'Canyon', 'Terrain', 'Acadia', 'Yukon', 'Yukon XL',
    'Savana', 'Safari', 'Envoy', 'Jimmy'
  ],
  'Peugeot': [
    '208', '308', '508', '2008', '3008', '5008', 'Partner', 'Expert',
    '301', '307', '407', '607', 'Boxer', 'Traveller'
  ],
  'Renault': [
    'Clio', 'Megane', 'Captur', 'Kadjar', 'Koleos', 'Talisman', 'Duster',
    'Sandero', 'Logan', 'Kwid', 'Triber', 'Arkana', 'Master'
  ],
  'Fiat': [
    '500', '500X', '500L', 'Panda', 'Tipo', 'Punto', 'Doblo', 'Ducato',
    'Fiorino', 'Strada', 'Toro', 'Mobi', 'Argo', 'Cronos'
  ],
  'Volvo': [
    'XC40', 'XC60', 'XC90', 'S60', 'S90', 'V60', 'V90', 'C40',
    'S40', 'S80', 'V40', 'V50', 'V70', 'C30', 'C70'
  ]
};

export function getModelsForMake(make: string): string[] {
  return vehicleModels[make] || [];
}

export function getYearRange(): number[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 35 }, (_, i) => currentYear - i);
}
