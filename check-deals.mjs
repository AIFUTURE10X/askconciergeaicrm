import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

const deals = await sql`SELECT title, enquiry_type, created_at FROM deals ORDER BY created_at DESC LIMIT 5`;
console.log('Recent deals:');
deals.forEach(d => console.log(`  ${d.title} | enquiry_type: ${d.enquiry_type || 'NULL'} | ${d.created_at}`));
