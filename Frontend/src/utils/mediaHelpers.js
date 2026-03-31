/**
 * Generates an array of random heights for audio waveforms.
 * This is kept outside React components to maintain purity during renders.
 *
 * @param {number} count The number of bars to generate.
 * @returns {Array<number>} An array of random percentages (20 to 100).
 */
export const generateWaveformHeights = (count = 15) => {
  return [...Array(count)].map(() => Math.random() * 80 + 20);
};