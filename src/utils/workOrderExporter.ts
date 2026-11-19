import { Recipe, RecipeMetrics } from '../types/erp';
import { formatCurrency, formatNumber, formatSubheading, getFormattedToday } from './calc';

export async function exportWorkOrderToPNG(
  recipe: Recipe,
  metrics: RecipeMetrics,
  currentYield: number
): Promise<void> {
  if (!window.html2canvas) {
    throw new Error('html2canvas 라이브러리를 불러올 수 없습니다.');
  }

  // Create an off-screen container with fixed 800px width and explicit inline styling
  const container = document.createElement('div');
  container.id = 'work-order-print-render-target';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.background = '#FFFFFF';
  container.style.color = '#1C1B18';
  container.style.fontFamily = '"Pretendard", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif';
  container.style.padding = '36px 40px';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-999';

  // Construct printable HTML
  const dateStr = getFormattedToday();

  // Ingredients rows HTML
  const rowsHtml = metrics.ingredients
    .map((ing) => {
      if (ing.isSubheading) {
        return `
        <tr style="background-color: #F1ECE4; border-top: 1.5px solid #CEC7BD; border-bottom: 1.5px solid #CEC7BD;">
          <td colspan="5" style="padding: 8px 12px; font-weight: 800; font-size: 13px; color: #1C1B18;">
            ▶ ${formatSubheading(ing.name)}
          </td>
        </tr>
      `;
      }

      return `
      <tr style="border-bottom: 1px solid #E2DDD5;">
        <td style="padding: 9px 12px; font-size: 13px; color: #1C1B18;">
          <strong>${ing.name}</strong>
          ${
            ing.isFlour
              ? '<span style="display:inline-block; font-size:10px; padding:1px 5px; margin-left:6px; background:#FAF0EC; color:#A85232; border-radius:3px; font-weight:700;">가루류</span>'
              : ''
          }
        </td>
        <td style="padding: 9px 12px; font-size: 13px; text-align: right; font-weight: 700; font-variant-numeric: tabular-nums;">
          ${formatNumber(ing.calculatedWeight, 1)} g
        </td>
        <td style="padding: 9px 12px; font-size: 13px; text-align: right; color: #5C5852; font-variant-numeric: tabular-nums;">
          ${ing.bakersPct > 0 ? ing.bakersPct.toFixed(1) + '%' : '-'}
        </td>
        <td style="padding: 9px 12px; font-size: 12px; text-align: right; color: #5C5852; font-variant-numeric: tabular-nums;">
          ${ing.packagePrice > 0 ? `${formatNumber(ing.packagePrice)}원 / ${formatNumber(ing.packageWeight)}g` : '-'}
        </td>
        <td style="padding: 9px 12px; font-size: 13px; text-align: right; font-weight: 700; color: #1C1B18; font-variant-numeric: tabular-nums;">
          ${ing.cost > 0 ? formatCurrency(ing.cost) : '-'}
        </td>
      </tr>
    `;
    })
    .join('');

  // Steps HTML
  const stepsHtml =
    recipe.steps && recipe.steps.length > 0
      ? `
      <div style="margin-top: 24px;">
        <div style="font-size: 15px; font-weight: 800; color: #174328; margin-bottom: 10px; border-bottom: 1px solid #E2DDD5; padding-bottom: 6px;">
          제조 공정 단계
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${recipe.steps
            .map(
              (s, i) => `
            <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 13px; line-height: 1.6; padding: 6px 10px; background: #FAF8F5; border: 1px solid #E2DDD5; border-radius: 4px;">
              <span style="display: inline-block; width: 14px; height: 14px; border: 1.5px solid #969087; border-radius: 2px; margin-top: 3px; flex-shrink: 0;"></span>
              <span style="font-weight: 700; color: #5C5852; min-width: 18px;">${i + 1}.</span>
              <span style="color: #1C1B18;">${s}</span>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `
      : '';

  // Meta notice box
  const noticeHtml =
    recipe.notice || recipe.temperature || recipe.time
      ? `
      <div style="display: flex; gap: 16px; background: #FAF8F5; border: 1px solid #E2DDD5; border-radius: 4px; padding: 10px 14px; margin-bottom: 16px; font-size: 13px;">
        ${
          recipe.temperature
            ? `<div><span style="color:#5C5852; font-weight:600;">오븐 온도: </span><strong>${recipe.temperature}</strong></div>`
            : ''
        }
        ${
          recipe.time
            ? `<div><span style="color:#5C5852; font-weight:600;">굽는 시간: </span><strong>${recipe.time}</strong></div>`
            : ''
        }
        ${
          recipe.notice
            ? `<div style="flex:1;"><span style="color:#5C5852; font-weight:600;">주의사항: </span><span>${recipe.notice}</span></div>`
            : ''
        }
      </div>
    `
      : '';

  container.innerHTML = `
    <div style="border-bottom: 2.5px solid #174328; padding-bottom: 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="background: #174328; color: #FFFFFF; font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 2px; letter-spacing: 0.5px;">JAMEON ERP</span>
          <span style="background: #FAF0EC; color: #A85232; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 2px;">${recipe.category || '베이커리'}</span>
        </div>
        <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #1C1B18; letter-spacing: -0.5px;">
          ${recipe.name}
        </h1>
        <div style="margin-top: 6px; font-size: 13px; color: #5C5852;">
          ${recipe.panName ? `기준 틀: <strong>${recipe.panName}</strong>` : ''}
          ${recipe.fillRatio ? ` (충전율 ${recipe.fillRatio}%)` : ''}
          ${recipe.specificGravity ? ` (반죽비중 ${recipe.specificGravity} g/ml)` : ''}
        </div>
      </div>

      <div style="text-align: right;">
        <div style="font-size: 14px; font-weight: 800; color: #174328; margin-bottom: 4px;">작업 지시서 (배합표)</div>
        <div style="font-size: 12px; color: #5C5852;">발행일자: ${dateStr}</div>
        <div style="font-size: 13px; font-weight: 700; color: #1C1B18; margin-top: 4px;">생산 지시 수량: ${currentYield}개</div>
      </div>
    </div>

    <!-- Summary Metrics Grid -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #EDF2EE; border: 1px solid #C3D9C8; border-radius: 4px; padding: 12px 16px; margin-bottom: 16px;">
      <div>
        <div style="font-size: 11px; color: #174328; font-weight: 700;">총 배합 중량</div>
        <div style="font-size: 17px; font-weight: 800; color: #174328; font-variant-numeric: tabular-nums;">${formatNumber(metrics.totalWeight, 1)} g</div>
      </div>
      <div>
        <div style="font-size: 11px; color: #174328; font-weight: 700;">총 가루류 중량</div>
        <div style="font-size: 17px; font-weight: 800; color: #174328; font-variant-numeric: tabular-nums;">${formatNumber(metrics.totalFlourWeight, 1)} g</div>
      </div>
      <div>
        <div style="font-size: 11px; color: #174328; font-weight: 700;">1개당 제조원가</div>
        <div style="font-size: 17px; font-weight: 800; color: #174328; font-variant-numeric: tabular-nums;">${formatCurrency(metrics.costPerPiece)}</div>
      </div>
      <div>
        <div style="font-size: 11px; color: #174328; font-weight: 700;">개당 판매가 (마진율)</div>
        <div style="font-size: 17px; font-weight: 800; color: #174328; font-variant-numeric: tabular-nums;">${formatCurrency(metrics.sellingPrice)} (${metrics.marginRate}%)</div>
      </div>
    </div>

    ${noticeHtml}

    <!-- Ingredients Table -->
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #E2DDD5; border-radius: 4px; overflow: hidden;">
      <thead>
        <tr style="background: #FAF8F5; border-bottom: 1.5px solid #CEC7BD;">
          <th style="padding: 10px 12px; font-size: 13px; font-weight: 800; color: #5C5852; text-align: left; width: 35%;">재료명</th>
          <th style="padding: 10px 12px; font-size: 13px; font-weight: 800; color: #5C5852; text-align: right; width: 18%;">배합량 (g)</th>
          <th style="padding: 10px 12px; font-size: 13px; font-weight: 800; color: #5C5852; text-align: right; width: 15%;">베이커스 (%)</th>
          <th style="padding: 10px 12px; font-size: 13px; font-weight: 800; color: #5C5852; text-align: right; width: 18%;">구매단가 / 규격</th>
          <th style="padding: 10px 12px; font-size: 13px; font-weight: 800; color: #5C5852; text-align: right; width: 14%;">재료 원가</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr style="background: #FAF8F5; border-top: 2px solid #1C1B18; font-weight: 900;">
          <td style="padding: 11px 12px; font-size: 13px; color: #1C1B18;">합계 (총 반죽 중량)</td>
          <td style="padding: 11px 12px; font-size: 14px; text-align: right; color: #174328; font-variant-numeric: tabular-nums;">
            ${formatNumber(metrics.totalWeight, 1)} g
          </td>
          <td style="padding: 11px 12px; font-size: 13px; text-align: right; color: #1C1B18; font-variant-numeric: tabular-nums;">
            ${metrics.totalFlourWeight > 0 ? ((metrics.totalWeight / metrics.totalFlourWeight) * 100).toFixed(1) + '%' : '100%'}
          </td>
          <td style="padding: 11px 12px; font-size: 12px; text-align: right; color: #5C5852;">재료비 합계</td>
          <td style="padding: 11px 12px; font-size: 14px; text-align: right; color: #174328; font-variant-numeric: tabular-nums;">
            ${formatCurrency(metrics.totalMaterialCost)}
          </td>
        </tr>
      </tbody>
    </table>

    ${stepsHtml}

    <div style="margin-top: 24px; padding-top: 10px; border-top: 1px solid #E2DDD5; display: flex; justify-content: space-between; font-size: 11px; color: #969087;">
      <span>JAMEON BAKERY ERP — Artisan Baking Recipe & Work Order Management</span>
      <span>${dateStr} 인쇄본</span>
    </div>
  `;

  document.body.appendChild(container);

  try {
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        // continue
      }
    }

    const canvas = await window.html2canvas(container, {
      scale: 2, // 2x high resolution
      backgroundColor: '#FFFFFF',
      useCORS: true,
      logging: false,
      windowWidth: 800,
    });

    const link = document.createElement('a');
    link.download = `[작업지시서]_${recipe.name}_${currentYield}개_${dateStr}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    document.body.removeChild(container);
  }
}
