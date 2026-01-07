import type { Column } from '../../src';
import { getCells, getCellsAtRowIndex, getHeaderCells, getRows, scrollGrid, setup } from './utils';

const rowHeight = 35;

function setupGrid(
  enableVirtualization: boolean,
  columnCount: number,
  rowCount: number,
  frozenColumnCount = 0,
  summaryRowCount = 0,
  overscanThreshold?: number
) {
  const columns: Column<unknown>[] = [];
  const rows = new Array(rowCount);
  const topSummaryRows = new Array(summaryRowCount).fill(null);
  const bottomSummaryRows = new Array(summaryRowCount).fill(null);

  for (let i = 0; i < columnCount; i++) {
    const key = String(i);
    columns.push({
      key,
      name: key,
      width: 100 + ((i * 10) % 50),
      frozen: i < frozenColumnCount
    });
  }

  return setup({
    columns,
    rows,
    topSummaryRows,
    bottomSummaryRows,
    rowHeight,
    enableVirtualization,
    overscanThreshold
  });
}

function assertElements(
  elements: Element[],
  attribute: string,
  count: number,
  startIdx: number,
  endIdx: number
) {
  expect(elements).toHaveLength(count);
  expect(elements[0]).toHaveAttribute(attribute, String(startIdx));
  expect(elements[elements.length - 1]).toHaveAttribute(attribute, String(endIdx));
}

function assertIndexes(
  cells: Element[],
  expectedIndexes: number[],
  attribute: string,
  indexOffset: number
) {
  const actualIndexes = cells.map(
    (cell) => Number.parseInt(cell.getAttribute(attribute)!, 10) - indexOffset
  );
  expect(actualIndexes).toStrictEqual(expectedIndexes);
}

function assertHeaderCells(count: number, startIdx: number, endIdx: number) {
  assertElements(getHeaderCells(), 'aria-colindex', count, startIdx + 1, endIdx + 1);
}

function assertHeaderCellIndexes(indexes: number[]) {
  assertIndexes(getHeaderCells(), indexes, 'aria-colindex', 1);
}

function assertRows(count: number, startIdx: number, endIdx: number) {
  assertElements(getRows(), 'aria-rowindex', count, startIdx + 2, endIdx + 2);
}

function assertRowIndexes(indexes: number[]) {
  assertIndexes(getRows(), indexes, 'aria-rowindex', 2);
}

function assertCells(rowIdx: number, count: number, startIdx: number, endIdx: number) {
  assertElements(getCellsAtRowIndex(rowIdx), 'aria-colindex', count, startIdx + 1, endIdx + 1);
}

function assertCellIndexes(rowIdx: number, indexes: number[]) {
  assertIndexes(getCellsAtRowIndex(rowIdx), indexes, 'aria-colindex', 1);
}

test('virtualization is enabled', async () => {
  await setupGrid(true, 30, 100);

  assertHeaderCells(18, 0, 17);
  assertRows(34, 0, 33);
  assertCells(0, 18, 0, 17);
  await scrollGrid({ scrollTop: 244 });
  assertRows(39, 2, 40);

  await scrollGrid({ scrollTop: 245 });
  assertRows(38, 3, 40);

  await scrollGrid({ scrollTop: 419 });
  assertRows(39, 7, 45);

  await scrollGrid({ scrollTop: 420 });
  assertRows(38, 8, 45);

  await scrollGrid({ scrollTop: 524 });
  assertRows(39, 10, 48);

  await scrollGrid({ scrollTop: 525 });
  assertRows(38, 11, 48);

  await scrollGrid({ scrollTop: 1000 });
  assertRows(39, 24, 62);

  // scroll height = header height + row height * row count
  // max top = scroll height - grid height
  await scrollGrid({ scrollTop: rowHeight + rowHeight * 100 - 1080 });
  assertRows(34, 66, 99);

  await scrollGrid({ scrollLeft: 92 });
  assertHeaderCells(18, 0, 17);
  assertCells(66, 18, 0, 17);

  await scrollGrid({ scrollLeft: 93 });
  assertHeaderCells(19, 0, 18);
  assertCells(66, 19, 0, 18);

  await scrollGrid({ scrollLeft: 209 });
  assertHeaderCells(19, 0, 18);
  assertCells(66, 19, 0, 18);

  await scrollGrid({ scrollLeft: 210 });
  assertHeaderCells(18, 1, 18);
  assertCells(66, 18, 1, 18);

  // max left = row width - grid width
  await scrollGrid({ scrollLeft: 3600 - 1920 });
  assertHeaderCells(17, 13, 29);
  assertCells(66, 17, 13, 29);
});

test('virtualization is enabled with 4 frozen columns', async () => {
  await setupGrid(true, 30, 30, 4);

  let indexes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  assertHeaderCellIndexes(indexes);
  assertCellIndexes(0, indexes);

  await scrollGrid({ scrollLeft: 1000 });
  indexes = [0, 1, 2, 3, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
  assertHeaderCellIndexes(indexes);
  assertCellIndexes(0, indexes);

  // max left = row width - grid width
  await scrollGrid({ scrollLeft: 3600 - 1920 });
  indexes = [0, 1, 2, 3, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29];
  assertHeaderCellIndexes(indexes);
  assertCellIndexes(0, indexes);
});

test('virtualization is enabled with all columns frozen', async () => {
  await setupGrid(true, 30, 30, 30);

  const indexes = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    26, 27, 28, 29
  ];
  assertHeaderCellIndexes(indexes);
  assertCellIndexes(0, indexes);

  await scrollGrid({ scrollLeft: 1000 });
  assertHeaderCellIndexes(indexes);
  assertCellIndexes(0, indexes);

  // max left = row width - grid width
  await scrollGrid({ scrollLeft: 3600 - 1920 });
  assertHeaderCellIndexes(indexes);
  assertCellIndexes(0, indexes);
});

test('virtualization is enabled with 2 summary rows', async () => {
  await setupGrid(true, 1, 100, 0, 2);

  assertRowIndexes([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    26, 27, 28, 29, 30, 31, 102, 103
  ]);

  await scrollGrid({ scrollTop: 1000 });
  assertRowIndexes([
    0, 1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
    48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 102, 103
  ]);
});

test('zero columns', async () => {
  await setupGrid(true, 0, 100);

  expect(getHeaderCells()).toHaveLength(0);
  expect(getCells()).toHaveLength(0);
  expect(getRows()).toHaveLength(0);
});

test('zero rows', async () => {
  await setupGrid(true, 20, 0);

  expect(getHeaderCells()).toHaveLength(18);
  expect(getCells()).toHaveLength(0);
  expect(getRows()).toHaveLength(0);
});

test('virtualization is enable with not enough columns or rows to virtualize', async () => {
  await setupGrid(true, 5, 5);

  assertHeaderCells(5, 0, 4);
  assertRows(5, 0, 4);

  const cells = getCells();
  expect(cells).toHaveLength(5 * 5);
});

test('enableVirtualization is disabled', async () => {
  await setupGrid(false, 40, 100);

  assertHeaderCells(40, 0, 39);
  assertRows(100, 0, 99);

  const cells = getCells();
  expect(cells).toHaveLength(40 * 100);
});

test('overscanThreshold with custom value of 0', async () => {
  // With overscanThreshold=0, only visible rows are rendered (no overscan)
  // Grid height is 1080px, header is 35px, so viewport is 1045px
  // With rowHeight=35, visible rows = floor(1045/35) = 29 rows (indices 0-28)
  await setupGrid(true, 1, 100, 0, 0, 0);

  // With 0 overscan, we should see exactly the visible rows
  assertRows(30, 0, 29);

  // Scroll down and verify no extra rows are rendered
  await scrollGrid({ scrollTop: 350 });
  // At scrollTop=350, first visible row is 350/35=10, last visible is 10+29=39
  assertRows(30, 10, 39);
});

test('overscanThreshold with custom value of 8', async () => {
  // With overscanThreshold=8, 8 extra rows are rendered above and below viewport
  await setupGrid(true, 1, 100, 0, 0, 8);

  // Initial render: visible rows 0-29 + 8 overscan below = rows 0-37
  // But overscan above is capped at 0, so we get rows 0-37 (38 rows)
  assertRows(38, 0, 37);

  // Scroll to middle and verify overscan on both sides
  await scrollGrid({ scrollTop: 1000 });
  // At scrollTop=1000, first visible row is floor(1000/35)=28, last visible is floor((1000+1045)/35)=58
  // With 8 overscan: start = 28-8=20, end = 58+8=66
  assertRows(47, 20, 66);
});

test('overscanThreshold with custom value of 2', async () => {
  // With overscanThreshold=2, 2 extra rows are rendered above and below viewport
  await setupGrid(true, 1, 100, 0, 0, 2);

  // Initial render: visible rows 0-29 + 2 overscan below = rows 0-31
  assertRows(32, 0, 31);

  // Scroll down and verify smaller overscan
  await scrollGrid({ scrollTop: 350 });
  // At scrollTop=350, first visible row is 10, last visible is 39
  // With 2 overscan: start = 10-2=8, end = 39+2=41
  assertRows(34, 8, 41);
});
