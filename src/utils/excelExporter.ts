import { Recipe, IngredientDBItem, PanDBItem } from '../types/erp';
import { getFormattedToday } from './calc';

export function exportAllDataToExcel(
  recipes: Recipe[],
  ingredients: IngredientDBItem[],
  pans: PanDBItem[]
): void {
  if (!window.XLSX) {
    throw new Error('XLSX 라이브러리를 불러올 수 없습니다.');
  }

  const wb = window.XLSX.utils.book_new();

  // 1. Ingredients DB Sheet
  const ingHeader = [
    '분류',
    '재료명',
    '제조사',
    '구매중량',
    '단위',
    '구매가격(원)',
    'g당단가',
    '구매처',
    '구매링크',
    '업데이트일',
    '비고',
  ];
  const ingRows = ingredients.map((item) => [
    item.category || '',
    item.name || '',
    item.manufacturer || '',
    item.weight || 0,
    item.unit || 'g',
    item.price || 0,
    item.weight > 0 ? Math.round((item.price / item.weight) * 100) / 100 : 0,
    item.shop || '',
    item.link || '',
    item.updatedAt || '',
    item.note || '',
  ]);
  const ingWs = window.XLSX.utils.aoa_to_sheet([ingHeader, ...ingRows]);
  window.XLSX.utils.book_append_sheet(wb, ingWs, '재료DB');

  // 2. Pans DB Sheet
  const panHeader = [
    '분류',
    '틀이름',
    '모양',
    '가로/지름(cm)',
    '세로(cm)',
    '높이(cm)',
    '용적(ml)',
    '권장충전율(%)',
    '비고',
    '업데이트일',
  ];
  const panRows = pans.map((p) => [
    p.category || '',
    p.name || '',
    p.shape || '',
    p.dim1 || 0,
    p.dim2 || 0,
    p.dim3 || 0,
    p.volume || 0,
    p.fillRatio || 75,
    p.note || '',
    p.updatedAt || '',
  ]);
  const panWs = window.XLSX.utils.aoa_to_sheet([panHeader, ...panRows]);
  window.XLSX.utils.book_append_sheet(wb, panWs, '구움틀DB');

  // 3. Individual Recipe Sheets
  recipes.forEach((r) => {
    // Sanitized sheet name max 31 chars
    const sheetName = r.name.replace(/[\\/?*[\]]/g, '').slice(0, 30) || '레시피';

    const sheetData: any[][] = [
      ['분류(카테고리)', r.category || '제과', '기준생산수량(개)', r.baseYield || 1, '판매가(원)', r.price || 0, '개당포장비(원)', r.packagingCost || 0],
      ['이미지 URL', r.image || '', '주의사항/팁', r.notice || '', '오븐/굽는 온도', r.temperature || '', '굽는 시간', r.time || ''],
      ['기준구움틀', r.panName || '', '반죽비중(g/ml)', r.specificGravity || 0, '충전율(%)', r.fillRatio || 75],
      [],
      ['[재료명]', '배합량(g)', '구매단가(원)', '구매용량(g)', '가루류(Y/N)', '재료원가(원)'],
    ];

    let totalWeight = 0;
    let totalCost = 0;

    r.ingredients.forEach((ing) => {
      const isSub = ing.name.startsWith('[소제목');
      const cost = !isSub && ing.packagePrice > 0 && ing.packageWeight > 0
        ? Math.round((ing.amount * ing.packagePrice) / ing.packageWeight)
        : 0;

      if (!isSub) {
        totalWeight += ing.amount;
        totalCost += cost;
      }

      sheetData.push([
        ing.name,
        isSub ? 0 : ing.amount,
        isSub ? 0 : ing.packagePrice,
        isSub ? 0 : ing.packageWeight,
        ing.isFlour ? 'Y' : 'N',
        cost,
      ]);
    });

    const packagingTotal = Math.round((r.packagingCost || 0) * (r.baseYield || 1));
    const grandTotal = totalCost + packagingTotal;
    const pieceCost = r.baseYield > 0 ? Math.round(grandTotal / r.baseYield) : 0;

    sheetData.push([]);
    sheetData.push(['총 제조원가(포장포함)', grandTotal, '1개당 원가', pieceCost, '재료원가 합계', totalCost]);
    sheetData.push([]);
    sheetData.push(['[제조공정 단계]', '공정 내용']);

    if (r.steps && r.steps.length > 0) {
      r.steps.forEach((step, idx) => {
        sheetData.push([idx + 1, step]);
      });
    }

    const rWs = window.XLSX.utils.aoa_to_sheet(sheetData);
    // Ensure unique sheet title
    let finalTitle = sheetName;
    let count = 1;
    while (wb.SheetNames.includes(finalTitle)) {
      finalTitle = `${sheetName.slice(0, 27)}_${count++}`;
    }
    window.XLSX.utils.book_append_sheet(wb, rWs, finalTitle);
  });

  // Save workbook
  const filename = `잠언베이글_ERP_전체백업_${getFormattedToday().replace(/\./g, '')}.xlsx`;
  window.XLSX.writeFile(wb, filename);
}
