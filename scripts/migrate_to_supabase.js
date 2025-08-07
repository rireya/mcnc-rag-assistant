import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

// Supabase 연결
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 기존 JSON 데이터 읽기
const chunks = JSON.parse(fs.readFileSync('./chunks.json', 'utf8'));
const embeddings = JSON.parse(fs.readFileSync('./embeddings.json', 'utf8'));

// 데이터 업로드
async function migrate() {
  for (const chunk of chunks) {
    const { error } = await supabase
      .from('documents')
      .upsert({
        chunk_id: chunk.id,
        content: chunk.text,
        embedding: embeddings[chunk.id], // 1536차원 벡터
        metadata: chunk.metadata || {}
      });

    if (error) console.error('Error:', error);
  }
  console.log('Migration complete!');
}

migrate();