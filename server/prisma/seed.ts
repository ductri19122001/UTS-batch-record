import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const powerBlendTemplateData = {
  title: 'Power Blend Production',
  sections: [
    {
      id: 'materials',
      title: 'Starting Materials',
      fields: [
        {
          id: 'material',
          name: 'material',
          label: 'Material',
          type: 'table',
          columns: [
            {
              id: 'description',
              label: 'Description',
              type: 'text',
            },
            {
              id: 'itemCode',
              label: 'Item Code',
              type: 'text',
            },
            {
              id: 'lotNo',
              label: 'Lot No.',
              type: 'text',
            },
            {
              id: 'composition',
              label: '% of Composition',
              type: 'number',
            },
            {
              id: 'tareWt',
              label: 'Tare Wt',
              type: 'number',
            },
            {
              id: 'actualWt',
              label: 'Actual Wt',
              type: 'number',
            },
            {
              id: 'grossWt',
              label: 'Gross Wt',
              type: 'number',
            },
          ],
        },
      ],
    },
    {
      id: 'processSteps',
      title: 'Production Procedure',
      fields: [],
      subsections: [
        {
          id: 'dispensing',
          title: 'Dispensing',
          fields: [
            {
              id: 'location',
              name: 'location',
              label: 'Location',
              type: 'text',
            },
            {
              id: 'temperature',
              name: 'temperature',
              label: 'Temperature',
              type: 'number',
              validation: '< 25°C',
            },
            {
              id: 'humidity',
              name: 'humidity',
              label: 'Humidity',
              type: 'number',
              validation: '< 60%',
            },
          ],
        },
        {
          id: 'mixing',
          title: 'Mixing',
          fields: [
            {
              id: 'mixTime',
              name: 'mixTime',
              label: 'Mix Time',
              type: 'duration',
              default: 20,
            },
          ],
        },
      ],
    },
    {
      id: 'qualityControl',
      title: 'In-Process Quality Control',
      fields: [
        {
          id: 'appearance',
          name: 'appearance',
          label: 'Appearance',
          spec: 'Off white powder with tiny red specks',
          type: 'text',
        },
        {
          id: 'pH',
          name: 'pH',
          label: 'pH',
          spec: '4.0-5.0',
          type: 'range',
          method: 'QC-T002',
        },
        {
          id: 'moisture',
          name: 'moisture',
          label: 'Moisture',
          spec: '≤5%',
          type: 'number',
          method: 'QC-T003',
        },
        {
          id: 'waterActivity',
          name: 'waterActivity',
          label: 'Water Activity',
          spec: '≤0.60aw',
          type: 'number',
          method: 'QC-T005',
        },
        {
          id: 'bulkDensity',
          name: 'bulkDensity',
          label: 'Bulk Density',
          spec: '0.7-1.0',
          type: 'range',
          method: 'QC-T001',
        },
      ],
    },
  ],
};

const vaccineTemplateData = {
  title: 'Vaccine Production',
  sections: [
    {
      id: 'rawMaterials',
      title: 'Raw Materials',
      fields: [
        {
          id: 'antigen',
          name: 'antigen',
          label: 'Antigen',
          type: 'text',
          required: true,
        },
        {
          id: 'adjuvant',
          name: 'adjuvant',
          label: 'Adjuvant',
          type: 'text',
          required: true,
        },
        {
          id: 'buffer',
          name: 'buffer',
          label: 'Buffer Solution',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      id: 'formulation',
      title: 'Formulation Process',
      fields: [
        {
          id: 'mixingTemperature',
          name: 'mixingTemperature',
          label: 'Mixing Temperature',
          type: 'number',
          spec: '2-8°C',
        },
        {
          id: 'mixingTime',
          name: 'mixingTime',
          label: 'Mixing Time',
          type: 'duration',
          spec: '30-45 minutes',
        },
        {
          id: 'pH',
          name: 'pH',
          label: 'pH Level',
          type: 'range',
          spec: '7.2-7.8',
        },
      ],
    },
    {
      id: 'qualityTests',
      title: 'Quality Control Tests',
      fields: [
        {
          id: 'sterility',
          name: 'sterility',
          label: 'Sterility Test',
          type: 'select',
          options: ['PASS', 'FAIL'],
          required: true,
        },
        {
          id: 'potency',
          name: 'potency',
          label: 'Potency Test',
          type: 'number',
          spec: '≥95%',
          required: true,
        },
        {
          id: 'identity',
          name: 'identity',
          label: 'Identity Test',
          type: 'select',
          options: ['PASS', 'FAIL'],
          required: true,
        },
      ],
    },
  ],
};

const tabletTemplateData = {
  title: 'Tablet Manufacturing',
  sections: [
    {
      id: 'rawMaterials',
      title: 'Raw Materials & Weighing',
      fields: [
        {
          id: 'activeIngredient',
          name: 'activeIngredient',
          label: 'Active Ingredient',
          type: 'text',
          required: true,
        },
        {
          id: 'excipients',
          name: 'excipients',
          label: 'Excipients',
          type: 'table',
          columns: [
            { id: 'name', label: 'Name', type: 'text' },
            { id: 'quantity', label: 'Quantity (mg)', type: 'number' },
            { id: 'lotNumber', label: 'Lot Number', type: 'text' },
          ],
        },
        {
          id: 'totalWeight',
          name: 'totalWeight',
          label: 'Total Weight (mg)',
          type: 'number',
          required: true,
        },
      ],
    },
    {
      id: 'granulation',
      title: 'Granulation Process',
      fields: [
        {
          id: 'mixingTime',
          name: 'mixingTime',
          label: 'Mixing Time',
          type: 'duration',
          spec: '5-10 minutes',
        },
        {
          id: 'binderSolution',
          name: 'binderSolution',
          label: 'Binder Solution Volume (ml)',
          type: 'number',
          spec: '10-15 ml',
        },
        {
          id: 'granuleSize',
          name: 'granuleSize',
          label: 'Granule Size Distribution',
          type: 'range',
          spec: '0.5-2.0 mm',
        },
      ],
    },
    {
      id: 'compression',
      title: 'Tablet Compression',
      fields: [
        {
          id: 'compressionForce',
          name: 'compressionForce',
          label: 'Compression Force (kN)',
          type: 'number',
          spec: '8-12 kN',
          required: true,
        },
        {
          id: 'tabletWeight',
          name: 'tabletWeight',
          label: 'Tablet Weight (mg)',
          type: 'number',
          spec: '500±25 mg',
          required: true,
        },
        {
          id: 'hardness',
          name: 'hardness',
          label: 'Tablet Hardness (N)',
          type: 'number',
          spec: '50-80 N',
        },
      ],
    },
    {
      id: 'qualityControl',
      title: 'Quality Control Tests',
      fields: [
        {
          id: 'appearance',
          name: 'appearance',
          label: 'Appearance',
          type: 'text',
          spec: 'White to off-white, round, biconvex tablets',
        },
        {
          id: 'disintegration',
          name: 'disintegration',
          label: 'Disintegration Time (min)',
          type: 'number',
          spec: '≤15 minutes',
        },
        {
          id: 'assay',
          name: 'assay',
          label: 'Assay (%)',
          type: 'number',
          spec: '95-105%',
          required: true,
        },
      ],
    },
  ],
};

const capsuleTemplateData = {
  title: 'Capsule Manufacturing',
  sections: [
    {
      id: 'formulation',
      title: 'Formulation Preparation',
      fields: [
        {
          id: 'activeIngredient',
          name: 'activeIngredient',
          label: 'Active Ingredient',
          type: 'text',
          required: true,
        },
        {
          id: 'filler',
          name: 'filler',
          label: 'Filler (Lactose/Microcrystalline Cellulose)',
          type: 'text',
          required: true,
        },
        {
          id: 'lubricant',
          name: 'lubricant',
          label: 'Lubricant (Magnesium Stearate)',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      id: 'blending',
      title: 'Powder Blending',
      fields: [
        {
          id: 'blendingTime',
          name: 'blendingTime',
          label: 'Blending Time',
          type: 'duration',
          spec: '10-15 minutes',
        },
        {
          id: 'blendingSpeed',
          name: 'blendingSpeed',
          label: 'Blending Speed (rpm)',
          type: 'number',
          spec: '25-30 rpm',
        },
        {
          id: 'uniformity',
          name: 'uniformity',
          label: 'Content Uniformity (%)',
          type: 'number',
          spec: '85-115%',
        },
      ],
    },
    {
      id: 'encapsulation',
      title: 'Capsule Filling',
      fields: [
        {
          id: 'capsuleSize',
          name: 'capsuleSize',
          label: 'Capsule Size',
          type: 'select',
          options: ['Size 0', 'Size 1', 'Size 2', 'Size 3'],
          required: true,
        },
        {
          id: 'fillWeight',
          name: 'fillWeight',
          label: 'Fill Weight (mg)',
          type: 'number',
          spec: '300±15 mg',
          required: true,
        },
        {
          id: 'fillingSpeed',
          name: 'fillingSpeed',
          label: 'Filling Speed (capsules/min)',
          type: 'number',
          spec: '100-150 capsules/min',
        },
      ],
    },
  ],
};

const materialsSectionData = {
  material: [
    {
      description: 'Vitamin blend base',
      itemCode: 'PB-MAT-001',
      lotNo: 'LOT-2025-001',
      composition: 60,
      tareWt: 0.8,
      actualWt: 600.5,
      grossWt: 601.3,
    },
    {
      description: 'Protein booster',
      itemCode: 'PB-MAT-002',
      lotNo: 'LOT-2025-002',
      composition: 25,
      tareWt: 0.5,
      actualWt: 250.2,
      grossWt: 250.7,
    },
    {
      description: 'Flavoring mix',
      itemCode: 'PB-MAT-010',
      lotNo: 'LOT-2025-010',
      composition: 15,
      tareWt: 0.2,
      actualWt: 149.1,
      grossWt: 149.3,
    },
  ],
};

const materialsSectionRevisionData = {
  material: [
    {
      description: 'Vitamin blend base',
      itemCode: 'PB-MAT-001',
      lotNo: 'LOT-2025-000',
      composition: 60,
      tareWt: 0.8,
      actualWt: 598.2,
      grossWt: 599.0,
    },
    {
      description: 'Protein booster',
      itemCode: 'PB-MAT-002',
      lotNo: 'LOT-2025-000',
      composition: 25,
      tareWt: 0.5,
      actualWt: 251.8,
      grossWt: 252.3,
    },
    {
      description: 'Flavoring mix',
      itemCode: 'PB-MAT-010',
      lotNo: 'LOT-2025-009',
      composition: 15,
      tareWt: 0.2,
      actualWt: 148.6,
      grossWt: 148.8,
    },
  ],
};

const qualityControlSectionData = {
  appearance: 'Off white powder with tiny red specks. No visible lumps.',
  pH: 4.5,
  moisture: 4.2,
  waterActivity: 0.58,
  bulkDensity: 0.85,
};

const qualityControlSectionDataChanged = {
  appearance: 'Off white powder with tiny red specks. No visible lumps.',
  pH: 4.5,
  moisture: 4.2,
  waterActivity: 0.70,
  bulkDensity: 0.85,
};

async function seed() {
  try {
    // Clear existing data to avoid conflicts
    console.log('Clearing existing data...');
    await prisma.batchRecordSection.deleteMany();
    await prisma.approvalRequest.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.deviation.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.batchRecord.deleteMany();
    await prisma.templateVersion.deleteMany();
    await prisma.templateRule.deleteMany();
    await prisma.batchRecordTemplate.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    // Create default user for templates (to avoid foreign key constraints)
    const defaultUser = await prisma.user.upsert({
      where: { email: 'default-user@nepbio.com.au' },
      update: {},
      create: {
        email: 'default-user@nepbio.com.au',
        firstName: 'Default',
        lastName: 'User',
        role: "ADMIN",
      },
    });

    const [alice, bob, steve] = await Promise.all([
      prisma.user.upsert({
        where: { email: 'alice@nepbio.com.au' },
        update: {
          firstName: 'Alice',
          lastName: 'Smith',
          role: "ADMIN",
        },
        create: {
          email: 'alice@nepbio.com.au',
          firstName: 'Alice',
          lastName: 'Smith',
          role: "ADMIN"
        },
      }),
      prisma.user.upsert({
        where: { email: 'bob@nepbio.com.au' },
        update: {
          firstName: 'Bob',
          lastName: 'Johnson',
          role: "SUPERVISOR",
        },
        create: {
          email: 'bob@nepbio.com.au',
          firstName: 'Bob',
          lastName: 'Johnson',
          role: "SUPERVISOR",
        },
      }),
      prisma.user.upsert({
        where: { email: 'steve@nepbio.com.au' },
        update: {
          firstName: 'Steve',
          lastName: 'Brown',
          role: "QA",
        },
        create: {
          email: 'steve@nepbio.com.au',
          firstName: 'Steve',
          lastName: 'Brown',
          role: "QA",
        },
      }),
    ]);

    // Create products
    const covidVaccine = await prisma.product.upsert({
      where: { productCode: 'COV-001' },
      update: {
        productName: 'COVID-19 Vaccine',
        category: "LIQUID",
        packSize: 10,
        packUnit: 'vials',
        shelfLife: 180,
        storageConditions: 'Store between 2°C and 8°C',
      },
      create: {
        productCode: 'COV-001',
        productName: 'COVID-19 Vaccine',
        category: "LIQUID",
        packSize: 10,
        packUnit: 'vials',
        shelfLife: 180,
        storageConditions: 'Store between 2°C and 8°C',
      },
    });

    const powerBlend = await prisma.product.upsert({
      where: { productCode: 'PB100' },
      update: {
        productName: 'Power Blend Nutritional Powder',
        category: "POWDER",
        packSize: 5,
        packUnit: 'kg',
        shelfLife: 365,
        storageConditions: 'Store in a cool dry place',
      },
      create: {
        productCode: 'PB100',
        productName: 'Power Blend Nutritional Powder',
        category: "POWDER",
        packSize: 5,
        packUnit: 'kg',
        shelfLife: 365,
        storageConditions: 'Store in a cool dry place',
      },
    });

    const hepBVaccine = await prisma.product.upsert({
      where: { productCode: 'HEP-B-001' },
      update: {
        productName: 'Hepatitis B Vaccine',
        category: "LIQUID",
        packSize: 20,
        packUnit: 'vials',
        shelfLife: 365,
        storageConditions: 'Store between 2°C and 8°C',
      },
      create: {
        productCode: 'HEP-B-001',
        productName: 'Hepatitis B Vaccine',
        category: "LIQUID",
        packSize: 20,
        packUnit: 'vials',
        shelfLife: 365,
        storageConditions: 'Store between 2°C and 8°C',
      },
    });

    // Create templates with versions and rules
    const powerBlendTemplate = await prisma.batchRecordTemplate.create({
      data: {
        id: 'power-blend-template',
        title: 'Power Blend Production',
        description: 'Batch record template for Power Blend Nutritional Powder production',
        createdBy: defaultUser.id,
        isActive: true,
      },
    });

    // Create initial version for power blend template
    const powerBlendVersion = await prisma.templateVersion.create({
      data: {
        templateId: powerBlendTemplate.id,
        version: 1,
        title: 'Power Blend Production',
        description: 'Batch record template for Power Blend Nutritional Powder production',
        data: powerBlendTemplateData,
        isActive: true,
        createdBy: defaultUser.id,
      },
    });

    // Create vaccine template
    const vaccineTemplate = await prisma.batchRecordTemplate.create({
      data: {
        id: 'vaccine-template',
        title: 'Vaccine Production',
        description: 'Batch record template for vaccine production processes',
        createdBy: defaultUser.id,
        isActive: true,
      },
    });

    // Create initial version for vaccine template
    const vaccineVersion = await prisma.templateVersion.create({
      data: {
        templateId: vaccineTemplate.id,
        version: 1,
        title: 'Vaccine Production',
        description: 'Batch record template for vaccine production processes',
        data: vaccineTemplateData,
        isActive: true,
        createdBy: defaultUser.id,
      },
    });

    // Create tablet manufacturing template
    const tabletTemplate = await prisma.batchRecordTemplate.create({
      data: {
        id: 'tablet-template',
        title: 'Tablet Manufacturing',
        description: 'Comprehensive batch record template for tablet manufacturing processes',
        createdBy: defaultUser.id,
        isActive: true,
      },
    });

    // Create initial version for tablet template
    const tabletVersion = await prisma.templateVersion.create({
      data: {
        templateId: tabletTemplate.id,
        version: 1,
        title: 'Tablet Manufacturing',
        description: 'Comprehensive batch record template for tablet manufacturing processes',
        data: tabletTemplateData,
        isActive: true,
        createdBy: defaultUser.id,
      },
    });

    // Create capsule manufacturing template
    const capsuleTemplate = await prisma.batchRecordTemplate.create({
      data: {
        id: 'capsule-template',
        title: 'Capsule Manufacturing',
        description: 'Batch record template for capsule manufacturing and filling processes',
        createdBy: defaultUser.id,
        isActive: true,
      },
    });

    // Create initial version for capsule template
    const capsuleVersion = await prisma.templateVersion.create({
      data: {
        templateId: capsuleTemplate.id,
        version: 1,
        title: 'Capsule Manufacturing',
        description: 'Batch record template for capsule manufacturing and filling processes',
        data: capsuleTemplateData,
        isActive: true,
        createdBy: defaultUser.id,
      },
    });

    // Create template rules for power blend template
    await prisma.templateRule.createMany({
      data: [
        {
          templateId: powerBlendTemplate.id,
          ruleType: 'FIELD_VALIDATION',
          ruleData: {
            type: 'field_validation',
            validationType: 'range',
            validationData: {
              max: 25,
            },
            message: 'Temperature must be below 25°C',
          },
          targetSectionId: 'dispensing',
          targetFieldId: 'temperature',
        },
        {
          templateId: powerBlendTemplate.id,
          ruleType: 'FIELD_VALIDATION',
          ruleData: {
            type: 'field_validation',
            validationType: 'range',
            validationData: {
              max: 60,
            },
            message: 'Humidity must be below 60%',
          },
          targetSectionId: 'dispensing',
          targetFieldId: 'humidity',
        },
        {
          templateId: powerBlendTemplate.id,
          ruleType: 'SECTION_DEPENDENCY',
          ruleData: {
            dependsOn: 'materials',
            condition: 'completed',
            message: 'Materials section must be completed before starting production',
          },
          targetSectionId: 'processSteps',
        },
      ],
    });

    // Create template rules for vaccine template
    await prisma.templateRule.createMany({
      data: [
        {
          templateId: vaccineTemplate.id,
          ruleType: 'FIELD_VALIDATION',
          ruleData: {
            type: 'field_validation',
            validationType: 'range',
            validationData: {
              min: 2,
              max: 8,
            },
            message: 'Mixing temperature must be between 2°C and 8°C',
          },
          targetSectionId: 'formulation',
          targetFieldId: 'mixingTemperature',
        },
        {
          templateId: vaccineTemplate.id,
          ruleType: 'FIELD_VALIDATION',
          ruleData: {
            type: 'field_validation',
            validationType: 'range',
            validationData: {
              min: 7.2,
              max: 7.8,
            },
            message: 'pH must be between 7.2 and 7.8',
          },
          targetSectionId: 'formulation',
          targetFieldId: 'pH',
        },
      ],
    });

    // Create template rules for tablet template
    await prisma.templateRule.createMany({
      data: [
        {
          templateId: tabletTemplate.id,
          ruleType: 'FIELD_VALIDATION',
          ruleData: {
            type: 'field_validation',
            validationType: 'range',
            validationData: {
              min: 8,
              max: 12,
            },
            message: 'Compression force must be between 8-12 kN',
          },
          targetSectionId: 'compression',
          targetFieldId: 'compressionForce',
        },
        {
          templateId: tabletTemplate.id,
          ruleType: 'FIELD_VALIDATION',
          ruleData: {
            type: 'field_validation',
            validationType: 'range',
            validationData: {
              min: 475,
              max: 525,
            },
            message: 'Tablet weight must be within 500±25 mg',
          },
          targetSectionId: 'compression',
          targetFieldId: 'tabletWeight',
        },
      ],
    });

    // Create template rules for capsule template
    await prisma.templateRule.createMany({
      data: [
        {
          templateId: capsuleTemplate.id,
          ruleType: 'FIELD_VALIDATION',
          ruleData: {
            type: 'field_validation',
            validationType: 'range',
            validationData: {
              min: 285,
              max: 315,
            },
            message: 'Fill weight must be within 300±15 mg',
          },
          targetSectionId: 'encapsulation',
          targetFieldId: 'fillWeight',
        },
        {
          templateId: capsuleTemplate.id,
          ruleType: 'FIELD_VALIDATION',
          ruleData: {
            type: 'field_validation',
            validationType: 'range',
            validationData: {
              min: 85,
              max: 115,
            },
            message: 'Content uniformity must be between 85-115%',
          },
          targetSectionId: 'blending',
          targetFieldId: 'uniformity',
        },
      ],
    });

    // Create a batch record using the new template structure
    const batchRecord = await prisma.batchRecord.create({
      data: {
        batchNumber: 'PB-2025-0001',
        productId: powerBlend.id,
        templateId: powerBlendTemplate.id,
        templateVersionId: powerBlendVersion.id,
        plannedQuantity: 1000,
        actualQuantity: 980,
        unit: 'kg',
        status: "IN_PROGRESS",
        shelfLifeMonths: 12,
        manufacturingDate: new Date('2025-01-17T08:00:00.000Z'),
        expiryDate: new Date('2026-01-17T08:00:00.000Z'),
        createdBy: alice.id,
        approvedBy: steve.id,
        approvedAt: new Date('2025-01-18T10:00:00.000Z'),
      },
    });

    const qualityChangeRequest = await prisma.approvalRequest.upsert({
      where: { id: 'pb-2025-0001-quality-req-1' },
      update: {
        batchRecordId: batchRecord.id,
        sectionId: 'qualityControl',
        requestType: 'CHANGE_REQUEST',
        reason: 'Update QC sampling schedule',
        description: 'Requesting approval to adjust sampling intervals after review.',
        existingData: qualityControlSectionData,
        proposedData: qualityControlSectionDataChanged,
        requestedBy: bob.id,
        requestedAt: new Date('2025-01-18T09:00:00.000Z'),
        status: 'PENDING',
      },
      create: {
        id: 'pb-2025-0001-quality-req-1',
        batchRecordId: batchRecord.id,
        sectionId: 'qualityControl',
        requestType: 'CHANGE_REQUEST',
        reason: 'Update QC sampling schedule',
        description: 'Requesting approval to adjust sampling intervals after review.',
        existingData: qualityControlSectionData,
        proposedData: qualityControlSectionDataChanged,
        requestedBy: bob.id,
        requestedAt: new Date('2025-01-18T09:00:00.000Z'),
        status: 'PENDING',
      },
    });

    // Historical batch record section versions
    await prisma.batchRecordSection.create({
      data: {
        id: 'pb-2025-0001-materials-v0',
        batchRecordId: batchRecord.id,
        sectionId: 'materials',
        sectionData: materialsSectionRevisionData,
        sectionType: "SECTION",
        status: "COMPLETED",
        version: 0,
        isActive: false,
        completedAt: new Date('2025-01-16T16:30:00.000Z'),
        completedBy: bob.id,
        lockedAt: new Date('2025-01-16T16:30:00.000Z'),
        lockedBy: bob.id,
      },
    });

    await prisma.batchRecordSection.create({
      data: {
        id: 'pb-2025-0001-quality-v0',
        batchRecordId: batchRecord.id,
        sectionId: 'qualityControl',
        sectionData: qualityControlSectionDataChanged,
        sectionType: "SECTION",
        status: 'COMPLETED',
        version: 0,
        isActive: false,
        completedAt: new Date('2025-01-17T08:45:00.000Z'),
        completedBy: bob.id,
        lockedAt: new Date('2025-01-17T08:45:00.000Z'),
        lockedBy: bob.id,
      },
    });

    // Active batch record sections
    await prisma.batchRecordSection.create({
      data: {
        id: 'pb-2025-0001-materials-v1',
        batchRecordId: batchRecord.id,
        sectionId: 'materials',
        sectionData: materialsSectionData,
        sectionType: "SECTION",
        status: "COMPLETED",
        version: 1,
        isActive: true,
        completedAt: new Date('2025-01-17T12:30:00.000Z'),
        completedBy: bob.id,
        lockedAt: new Date('2025-01-17T12:30:00.000Z'),
        lockedBy: bob.id,
        previousVersionId: 'pb-2025-0001-materials-v0',
      },
    });

    await prisma.batchRecordSection.create({
      data: {
        id: 'pb-2025-0001-quality-v1',
        batchRecordId: batchRecord.id,
        sectionId: 'qualityControl',
        sectionData: qualityControlSectionData,
        sectionType: "SECTION",
        status: 'PENDING_APPROVAL',
        version: 1,
        isActive: true,
        lockedAt: new Date('2025-01-18T09:00:00.000Z'),
        lockedBy: bob.id,
        approvalRequestId: qualityChangeRequest.id,
        previousVersionId: 'pb-2025-0001-quality-v0',
      },
    });

    console.log('✅ Database seeded successfully with:');
    console.log(`   - ${await prisma.user.count()} users`);
    console.log(`   - ${await prisma.product.count()} products`);
    console.log(`   - ${await prisma.batchRecordTemplate.count()} templates`);
    console.log(`   - ${await prisma.templateVersion.count()} template versions`);
    console.log(`   - ${await prisma.templateRule.count()} template rules`);
    console.log(`   - ${await prisma.batchRecord.count()} batch records`);
    console.log(`   - ${await prisma.batchRecordSection.count()} batch record sections`);

  } catch (error) {
    console.error('❌ Failed to seed database:', error);
    throw error;
  }
}

seed()
  .then(() => {
    console.info('🎉 Seed data written successfully.');
  })
  .catch((error) => {
    console.error('💥 Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
