import { test } from 'node:test';
import assert from 'node:assert';

// applyGenderWith(text, gender) — тестируемое ядро без env
import { applyGenderWith } from './profile.js';

test('female: текст не меняется', () => {
  assert.equal(applyGenderWith('ขอบคุณค่ะ', 'female'), 'ขอบคุณค่ะ');
  assert.equal(applyGenderWith('sà-baai-dii mǎi khá', 'female'), 'sà-baai-dii mǎi khá');
});

test('male: женская частица меняется на мужскую', () => {
  assert.equal(applyGenderWith('ขอบคุณค่ะ', 'male'), 'ขอบคุณครับ');
  assert.equal(applyGenderWith('สบายดีไหมคะ', 'male'), 'สบายดีไหมครับ');
  assert.equal(applyGenderWith('khòp-khun khâ', 'male'), 'khòp-khun khráp');
  assert.equal(applyGenderWith('sà-baai-dii mǎi khá', 'male'), 'sà-baai-dii mǎi khráp');
});

test('male: несколько частиц в строке', () => {
  assert.equal(applyGenderWith('ใช่ค่ะ / ไม่ใช่ค่ะ', 'male'), 'ใช่ครับ / ไม่ใช่ครับ');
});

test('идемпотентность: уже мужская частица не портится', () => {
  assert.equal(applyGenderWith('ขอบคุณครับ', 'male'), 'ขอบคุณครับ');
});

test('пустые/нестроковые входы безопасны', () => {
  assert.equal(applyGenderWith('', 'male'), '');
  assert.equal(applyGenderWith(null, 'male'), null);
});
