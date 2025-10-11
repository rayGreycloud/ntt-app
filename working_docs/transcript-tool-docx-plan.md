# 🧾 Next.js + Vercel Word Document Generator (Streaming Version)

This guide shows how to:

1. Use a `.docx` template containing layout, page numbers, and formatting  
2. Inject your processed **transcript text** (with preserved line breaks)  
3. Stream the generated `.docx` back to the browser for download — perfect for large legal documents

---

## 🧱 Project Setup

### 1. Install Dependencies

```bash
npm install docxtemplater pizzip
```

*(Optionally)* add `@types/node` for TypeScript type safety:

```bash
npm install --save-dev @types/node
```

---

### 2. Project Structure

