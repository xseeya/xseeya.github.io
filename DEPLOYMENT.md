# Инструкция по развертыванию на GitHub Pages

## Метод 1: Прямое развертывание (самый простой)

### Шаг 1: Подготовка репозитория

1. Создайте новый репозиторий на GitHub
2. Клонируйте репозиторий локально:
   ```bash
   git clone https://github.com/username/repository-name.git
   cd repository-name
   ```

### Шаг 2: Добавление файлов

1. Скопируйте все файлы проекта в папку репозитория
2. Добавьте свои аудиофайлы в папку `music/`
3. Добавьте LRC файлы в папку `lyrics/` (опционально)
4. Отредактируйте `playlist.json` с вашими треками

### Шаг 3: Коммит и пуш

```bash
git add .
git commit -m "Initial commit: Personal site with music player"
git push origin main
```

### Шаг 4: Настройка GitHub Pages

1. Перейдите в ваш репозиторий на GitHub
2. Откройте Settings → Pages
3. В разделе "Source" выберите:
   - Branch: `main` (или `gh-pages`)
   - Folder: `/ (root)`
4. Нажмите Save
5. Подождите несколько минут

Ваш сайт будет доступен по адресу: `https://username.github.io/repository-name/`

---

## Метод 2: Автоматический деплой с GitHub Actions

### Шаг 1: Создание workflow файла

Создайте файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Pages
        uses: actions/configure-pages@v3
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: '.'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

### Шаг 2: Настройка GitHub Pages

1. Settings → Pages
2. Source: выберите "GitHub Actions"
3. Готово!

Теперь при каждом пуше в ветку `main` сайт будет автоматически обновляться.

---

## Метод 3: Использование отдельной ветки gh-pages

### Шаг 1: Создание ветки gh-pages

```bash
# Создать пустую ветку gh-pages
git checkout --orphan gh-pages

# Удалить все файлы
git rm -rf .

# Добавить файлы проекта
cp -r /path/to/project/* .

# Коммит
git add .
git commit -m "Deploy to gh-pages"

# Пуш
git push origin gh-pages
```

### Шаг 2: Настройка

1. Settings → Pages
2. Source: `gh-pages` branch
3. Save

---

## Использование пользовательского домена (опционально)

### Шаг 1: Настройка DNS

Добавьте в настройках вашего домена:

Для apex домена (example.com):
```
A     185.199.108.153
A     185.199.109.153
A     185.199.110.153
A     185.199.111.153
```

Для поддомена (www.example.com):
```
CNAME    username.github.io
```

### Шаг 2: Настройка в GitHub

1. Settings → Pages
2. Custom domain: введите ваш домен
3. Отметьте "Enforce HTTPS"
4. Save

### Шаг 3: Добавление CNAME файла

Создайте файл `CNAME` в корне проекта:
```
yourdomain.com
```

---

## Проверка развертывания

После развертывания проверьте:

1. ✅ Сайт открывается по правильному URL
2. ✅ Все стили загружаются корректно
3. ✅ JavaScript работает (плеер функционирует)
4. ✅ Аудиофайлы воспроизводятся
5. ✅ LRC тексты синхронизируются
6. ✅ Переключение темы работает
7. ✅ Адаптивность на мобильных устройствах

---

## Устранение проблем

### Проблема: 404 ошибка

**Решение:**
- Убедитесь, что в Settings → Pages выбрана правильная ветка
- Проверьте, что файл `index.html` находится в корне выбранной папки

### Проблема: CSS/JS не загружаются

**Решение:**
- Проверьте пути в HTML файле
- Убедитесь, что пути относительные, без начального слеша
- Для путей используйте: `css/styles.css`, а не `/css/styles.css`

### Проблема: Аудио не воспроизводится

**Решение:**
- Убедитесь, что аудиофайлы добавлены в репозиторий
- Проверьте размер файлов (GitHub имеет лимит 100MB на файл)
- Используйте форматы MP3 или OGG для лучшей совместимости
- Проверьте пути в `playlist.json`

### Проблема: CORS ошибки

**Решение:**
- GitHub Pages автоматически настраивает правильные CORS заголовки
- Убедитесь, что все файлы находятся в том же репозитории

---

## Оптимизация для GitHub Pages

### Сжатие аудиофайлов

Для уменьшения размера репозитория:

```bash
# MP3 с битрейтом 128kbps (хорошее качество, малый размер)
ffmpeg -i input.mp3 -b:a 128k output.mp3

# Конвертация в OGG (лучшее сжатие)
ffmpeg -i input.mp3 -c:a libvorbis -q:a 4 output.ogg
```

### Git LFS для больших файлов

Если файлы очень большие, используйте Git LFS:

```bash
# Установка Git LFS
git lfs install

# Отслеживание аудиофайлов
git lfs track "*.mp3"
git lfs track "*.ogg"

# Коммит
git add .gitattributes
git commit -m "Setup Git LFS"
```

---

## Обновление сайта

После внесения изменений:

```bash
git add .
git commit -m "Update: описание изменений"
git push origin main
```

GitHub Pages автоматически обновит сайт в течение нескольких минут.

---

## Полезные ссылки

- [Официальная документация GitHub Pages](https://docs.github.com/pages)
- [Устранение проблем](https://docs.github.com/pages/getting-started-with-github-pages/troubleshooting-404-errors)
- [Пользовательские домены](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [Git LFS](https://git-lfs.github.com/)
