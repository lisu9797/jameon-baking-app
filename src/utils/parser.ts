import { Recipe, RecipeIngredient, IngredientDBItem } from '../types/erp';

// Declare globals for CDN libraries
declare global {
  interface Window {
    XLSX?: any;
    html2canvas?: any;
    Tesseract?: any;
  }
}

/**
 * Heuristics to check if an ingredient is flour/powder base
 */
export function isLikelyFlour(name: string): boolean {
  const flourKeywords = [
    '강력분', '중력분', '박력분', '강력', '중력', '박력',
    '밀가루', '통밀가루', '통밀분', '호밀가루', '호밀분', '쌀가루',
    '아몬드가루', '아몬드분말', '코코아가루', '코코아파우더', '말차가루', '쑥가루'
  ];
  const lower = name.toLowerCase().replace(/\s+/g, '');
  return flourKeywords.some((kw) => lower.includes(kw));
}

/**
 * Try to match ingredient name against ingredient DB to fetch price & weight
 */
export function matchIngredientFromDB(
  name: string,
  db: IngredientDBItem[]
): { packagePrice: number; packageWeight: number; matchedName?: string } {
  const cleanName = name.trim().toLowerCase();
  
  // 1. Exact match
  const exact = db.find((item) => item.name.trim().toLowerCase() === cleanName);
  if (exact) {
    return { packagePrice: exact.price || 0, packageWeight: exact.weight || 1000, matchedName: exact.name };
  }

  // 2. Substring match
  const partial = db.find((item) => {
    const dbName = item.name.trim().toLowerCase();
    return dbName.includes(cleanName) || cleanName.includes(dbName);
  });
  if (partial) {
    return { packagePrice: partial.price || 0, packageWeight: partial.weight || 1000, matchedName: partial.name };
  }

  return { packagePrice: 0, packageWeight: 1000 };
}

/**
 * Parse raw pasted text into Recipe structure
 */
export function parseRecipeText(rawText: string, ingredientDB: IngredientDBItem[] = []): Partial<Recipe> {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let name = '';
  let category = '베이커리';
  let baseYield = 1;
  let price = 0;
  let packagingCost = 0;
  let panName = '';
  let notice = '';
  let temperature = '';
  let time = '';

  const ingredients: RecipeIngredient[] = [];
  const steps: string[] = [];

  let isStepSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect section transitions
    if (/^(제조\s*공정|공정|만드는\s*법|과정|순서|steps?|instructions?)/i.test(line)) {
      isStepSection = true;
      continue;
    }
    if (/^(재료|배합비|배합표|ingredients?)/i.test(line)) {
      isStepSection = false;
      continue;
    }

    // Header metadata extraction
    const titleMatch = line.match(/^(?:레시피명|제품명|메뉴명|제목)\s*[:：]\s*(.+)$/i);
    if (titleMatch) {
      name = titleMatch[1].trim();
      continue;
    }

    const yieldMatch = line.match(/(?:기준생산수량|생산수량|수량|분량)\s*[:：]?\s*(\d+)/i);
    if (yieldMatch && !isStepSection) {
      baseYield = parseInt(yieldMatch[1], 10) || 1;
      continue;
    }

    const priceMatch = line.match(/(?:판매가|가격)\s*[:：]?\s*([\d,]+)/i);
    if (priceMatch && !isStepSection) {
      price = parseInt(priceMatch[1].replace(/,/g, ''), 10) || 0;
      continue;
    }

    const panMatch = line.match(/(?:틀|구움틀|팬)\s*[:：]\s*(.+)$/i);
    if (panMatch && !isStepSection) {
      panName = panMatch[1].trim();
      continue;
    }

    const tempMatch = line.match(/(?:오븐|온도)\s*[:：]?\s*(\d+[\s~-]*\d*\s*[℃도CFcf]?)/i);
    if (tempMatch && !isStepSection) {
      temperature = tempMatch[1].trim();
    }

    const timeMatch = line.match(/(?:시간|굽는\s*시간)\s*[:：]?\s*(\d+[\s~-]*\d*\s*분?)/i);
    if (timeMatch && !isStepSection) {
      time = timeMatch[1].trim();
    }

    // If first line has no special prefix and name is empty, treat as title
    if (i === 0 && !name && !line.includes(':') && !/\d+g|\d+\s*g/i.test(line)) {
      name = line.replace(/^[#\s*]+/, '').trim();
      continue;
    }

    // Step section line
    if (isStepSection || /^\d+[\.、\)]\s*/.test(line)) {
      const cleanStep = line.replace(/^\d+[\.、\)]\s*/, '').trim();
      if (cleanStep) steps.push(cleanStep);
      continue;
    }

    // Subheading detection: [소제목: 토핑], 【소보로】, [크럼블], --- 크림 ---
    const subMatch = line.match(/^(?:\[소제목\s*[:：]?\s*(.+?)\]|【(.+?)】|\[(.+?)\]|---\s*(.+?)\s*---)/);
    if (subMatch) {
      const headingText = (subMatch[1] || subMatch[2] || subMatch[3] || subMatch[4]).trim();
      // Only treat as subheading if not an ingredient line with weight
      if (!/\d+g|\d+\s*g/i.test(headingText)) {
        ingredients.push({
          name: `[소제목: ${headingText}]`,
          amount: 0,
          packagePrice: 0,
          packageWeight: 1000,
          isFlour: false,
          isSubheading: true,
        });
        continue;
      }
    }

    // Check if line looks like an ingredient (e.g. "강력분 250g", "버터: 50g", "설탕 30")
    // Pattern: name + optional separator + number + optional 'g' / 'ml'
    const ingMatch = line.match(/^([^\d:：\t,]+?)\s*[:：\t]?\s*([\d\.]+)\s*(?:g|ml|개|ea)?(?:\s+(.*))?$/i);
    if (ingMatch) {
      const ingName = ingMatch[1].trim();
      const amount = parseFloat(ingMatch[2]) || 0;
      const extra = ingMatch[3] || '';

      const isFlour = extra.includes('가루') || extra.includes('밀가루') || isLikelyFlour(ingName);
      const dbMatch = matchIngredientFromDB(ingName, ingredientDB);

      ingredients.push({
        name: ingName,
        amount,
        packagePrice: dbMatch.packagePrice,
        packageWeight: dbMatch.packageWeight,
        isFlour,
      });
      continue;
    }

    // Tab-delimited (copy-paste from excel or sheet table)
    const tabs = line.split('\t');
    if (tabs.length >= 2) {
      const ingName = tabs[0].trim();
      const amount = parseFloat(tabs[1].replace(/,/g, '')) || 0;
      const priceVal = tabs[2] ? parseFloat(tabs[2].replace(/,/g, '')) || 0 : 0;
      const weightVal = tabs[3] ? parseFloat(tabs[3].replace(/,/g, '')) || 1000 : 1000;
      const flourVal = tabs[4] ? tabs[4].trim().toUpperCase() === 'Y' : isLikelyFlour(ingName);

      if (ingName && (amount > 0 || isLikelyFlour(ingName) || ingName.startsWith('['))) {
        ingredients.push({
          name: ingName,
          amount,
          packagePrice: priceVal,
          packageWeight: weightVal,
          isFlour: flourVal,
        });
        continue;
      }
    }

    // If line has no numbers and looks like a note or notice
    if (!name && line.length < 30) {
      name = line;
    } else if (line.length > 0) {
      if (!notice) notice = line;
      else notice += '\n' + line;
    }
  }

  return {
    name: name || '새 레시피',
    category,
    baseYield,
    price,
    packagingCost,
    panName,
    notice,
    temperature,
    time,
    ingredients,
    steps,
  };
}

/**
 * Recognize text from image file using Tesseract.js
 */
export async function runOcrOnImage(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<string> {
  if (!window.Tesseract) {
    throw new Error('Tesseract.js 라이브러리가 로드되지 않았습니다.');
  }

  const worker = await window.Tesseract.createWorker('kor+eng', 1, {
    logger: (m: any) => {
      if (m.status === 'recognizing text' && m.progress !== undefined) {
        onProgress?.(Math.round(m.progress * 100), '텍스트 인식 중...');
      } else if (m.status) {
        onProgress?.(0, m.status);
      }
    },
  });

  try {
    const ret = await worker.recognize(file);
    await worker.terminate();
    return ret.data.text || '';
  } catch (err: any) {
    await worker.terminate();
    throw err;
  }
}

/**
 * Parse an Excel file (.xlsx, .xls, .csv)
 * Returns array of sheet names and parser function
 */
export async function readExcelFile(file: File): Promise<{
  sheetNames: string[];
  parseSheet: (sheetName: string, ingredientDB: IngredientDBItem[]) => Recipe;
}> {
  if (!window.XLSX) {
    throw new Error('XLSX 라이브러리가 로드되지 않았습니다.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
  const sheetNames = workbook.SheetNames || [];

  return {
    sheetNames,
    parseSheet: (sheetName: string, ingredientDB: IngredientDBItem[]): Recipe => {
      const worksheet = workbook.Sheets[sheetName];
      const json: any[][] = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      let category = '베이커리';
      let baseYield = 1;
      let price = 0;
      let packagingCost = 0;
      let panName = '';
      let specificGravity = 0;
      let fillRatio = 75;
      let notice = '';
      let temperature = '';
      let time = '';

      const ingredients: RecipeIngredient[] = [];
      const steps: string[] = [];

      let readingIngredients = false;
      let readingSteps = false;

      for (let r = 0; r < json.length; r++) {
        const row = json[r];
        if (!row || row.length === 0) continue;

        const firstCol = String(row[0] || '').trim();

        // Check header row 1
        if (firstCol.includes('분류(카테고리)')) {
          category = String(row[1] || '베이커리').trim();
          baseYield = Number(row[3]) || 1;
          price = Number(row[5]) || 0;
          packagingCost = Number(row[7]) || 0;
          continue;
        }

        // Check header row 2
        if (firstCol.includes('이미지 URL')) {
          notice = String(row[3] || '').trim();
          temperature = String(row[5] || '').trim();
          time = String(row[7] || '').trim();
          continue;
        }

        // Check header row 3
        if (firstCol.includes('기준구움틀')) {
          panName = String(row[1] || '').trim();
          specificGravity = Number(row[3]) || 0;
          fillRatio = Number(row[5]) || 75;
          continue;
        }

        // Check ingredients header
        if (firstCol.includes('[재료명]') || firstCol === '재료명') {
          readingIngredients = true;
          readingSteps = false;
          continue;
        }

        // Check total cost row or steps header
        if (firstCol.includes('총 제조원가') || firstCol.includes('재료원가 합계')) {
          readingIngredients = false;
          continue;
        }

        if (firstCol.includes('[제조공정 단계]') || firstCol.includes('공정') || firstCol.includes('제조공정')) {
          readingIngredients = false;
          readingSteps = true;
          continue;
        }

        if (readingIngredients) {
          const ingName = String(row[0] || '').trim();
          if (!ingName || ingName === '합계') continue;

          const amount = Number(row[1]) || 0;
          const packagePrice = Number(row[2]) || 0;
          const packageWeight = Number(row[3]) || 1000;
          const isFlour = String(row[4] || '').toUpperCase() === 'Y' || isLikelyFlour(ingName);
          const isSub = ingName.startsWith('[소제목') || (amount === 0 && packagePrice === 0);

          ingredients.push({
            name: ingName,
            amount,
            packagePrice,
            packageWeight,
            isFlour,
            isSubheading: isSub,
          });
        }

        if (readingSteps) {
          const stepText = String(row[1] || row[0] || '').trim();
          if (stepText && !/^\d+$/.test(stepText)) {
            steps.push(stepText);
          }
        }
      }

      // If sheet didn't follow the structured format, fallback to text parsing
      if (ingredients.length === 0) {
        const fullText = json.map((r) => r.join('\t')).join('\n');
        const fallback = parseRecipeText(fullText, ingredientDB);
        return {
          name: fallback.name || sheetName,
          category: fallback.category || category,
          baseYield: fallback.baseYield || baseYield,
          price: fallback.price || price,
          packagingCost: fallback.packagingCost || packagingCost,
          panName: fallback.panName || panName,
          specificGravity: fallback.specificGravity || specificGravity,
          fillRatio: fallback.fillRatio || fillRatio,
          image: fallback.image || '',
          notice: fallback.notice || notice,
          temperature: fallback.temperature || temperature,
          time: fallback.time || time,
          ingredients: fallback.ingredients || [],
          steps: fallback.steps || [],
        };
      }

      return {
        name: sheetName,
        category,
        baseYield,
        price,
        packagingCost,
        panName,
        specificGravity,
        fillRatio,
        image: '',
        notice,
        temperature,
        time,
        ingredients,
        steps,
      };
    },
  };
}
