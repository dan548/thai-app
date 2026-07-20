# Ручная установка (без Claude)

1. Установи зависимости: `npm install`.
2. Создай проект на https://supabase.com.
3. В **SQL Editor** выполни по очереди:
   - `supabase/schema.sql`
   - `supabase/seed.sql`
4. В **Project Settings → API** возьми Project URL и anon (publishable) ключ.
5. Скопируй `.env.example` в `.env.local` и заполни:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_USER_NAME=ТвоёИмя
   NEXT_PUBLIC_USER_GENDER=female   # или male
   ```
6. Запусти: `npm run dev` → http://localhost:3000.
7. Деплой (по желанию): импортируй репозиторий в Vercel, задай те же 4
   переменные окружения, задеплой.

Intro-фразы «Меня зовут…», «Я из…» в базовый seed не входят — добавь их сам
через экран «➕ Добавить фразу» или попроси Claude.
