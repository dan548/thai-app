# Ручная установка (без Claude)

Нужны Node.js 22+ и аккаунт Supabase. Порядок важен: защита владельца
ставится до первого открытия приложения.

1. Установи зависимости: `npm install`.
2. Создай проект на https://supabase.com.
3. В **SQL Editor** выполни `supabase/schema.sql`.
4. В **Authentication → Users → Add user → Create new user** создай
   единственного пользователя: свой email, свой пароль, включи
   **Auto Confirm User**. Пароль нигде в проекте не хранится.
5. Открой `supabase/secure-owner.sql`, замени в нём `owner@example.com`
   (`owner_email`) на этот email и выполни. Файл в репозитории оставь как есть.
6. Выполни по очереди: `supabase/save-grade.sql`,
   `supabase/learning-workflows.sql`, `supabase/restore-backup.sql`.
7. Выполни `supabase/seed.sql`, затем `supabase/seed-decisions.sql`
   (стартовые фразы сразу попадают в занятия; слова из видео остаются на выбор).
   Seed повторно не запускай.
8. Для проверки выполни `supabase/security-check.sql` и
   `supabase/learning-check.sql`: ошибок быть не должно, изменения откатываются.
9. В **Authentication** отключи регистрацию новых пользователей
   (Allow new users to sign up) и, если тариф позволяет, включи проверку
   скомпрометированных паролей. Подробности — [docs/security.md](security.md).
10. В **Project Settings → API** возьми Project URL и anon (publishable) ключ.
11. Скопируй `.env.example` в `.env.local` и заполни:
    ```
    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    NEXT_PUBLIC_USER_NAME=ТвоёИмя
    NEXT_PUBLIC_USER_GENDER=female   # или male
    ```
12. Запусти: `npm test`, затем `npm run dev` → http://localhost:3000 и войди
    email и паролем владельца из шага 4.
13. Деплой (по желанию): импортируй репозиторий в Vercel, задай те же 4
    переменные окружения, задеплой и проверь вход там же.

Intro-фразы «Меня зовут…», «Я из…» в базовый seed не входят. Добавь их через
экран «➕ Добавить фразу» (они попадут во «Входящие» — выбери «Учить») или
попроси Claude.
