// Supabase возвращает ошибки в результате, а не всегда отклоняет Promise.
// Повтор запроса безопасен только для идемпотентных update/upsert/delete.
export async function confirmedWrite(request, attempts = 3) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const result = await request();
      if (!result.error) return result;
      const status = Number(result.status);
      if (status && status < 500 && status !== 408 && status !== 429) throw Object.assign(new Error(result.error.message), { permanent: true });
      throw result.error;
    } catch (error) {
      if (error.permanent || attempt === attempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
}
