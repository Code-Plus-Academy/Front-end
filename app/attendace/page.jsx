import { redirect } from 'next/navigation';
import NoIndex from '../../src/components/seo/NoIndex';

export default function AttendaceTypoPage() {
  redirect('/attendance');
}
