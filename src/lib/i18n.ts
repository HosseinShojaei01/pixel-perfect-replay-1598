import { useApp } from "./store";
import { regionInfo } from "./ancestry";

const fa: Record<string, string> = {
  "Features": "ویژگی‌ها", "How It Works": "چگونه کار می‌کند", "Get Started": "شروع کنید",
  "Discover the Story Behind Your DNA": "داستان پشت DNA خود را کشف کنید",
  "Explore your ancestry through a beautiful interactive experience.": "تبار خود را با تجربه‌ای زیبا و تعاملی کاوش کنید.",
  "Explore My Origins": "کاوش ریشه‌هایم", "View Demo": "مشاهده دمو",
  "Import Real Results": "وارد کردن نتایج واقعی",
  "Simulated Demo Data — Not a Genetic Analysis": "داده نمایشی شبیه‌سازی‌شده — تحلیل ژنتیکی نیست",
  "User-supplied DNA results": "نتایج DNA ارائه‌شده توسط کاربر",
  "Upload your portrait": "تصویر خود را بارگذاری کنید",
  "Continue": "ادامه", "Continue in Demo Mode": "ادامه در حالت دمو", "Remove": "حذف",
  "Your Ancestry Dashboard": "داشبورد تبار شما", "Welcome": "خوش آمدید",
  "Download PDF": "دانلود PDF", "Share preview": "پیش‌نمایش اشتراک", "Delete photo": "حذف عکس",
  "Ancestry Story": "داستان تبار", "Country Breakdown": "تفکیک کشورها", "Distribution": "توزیع",
  "Geographic Map": "نقشه جغرافیایی", "Your Genome, Visualized": "ژنوم شما، به تصویر کشیده",
  "Preparing Your Experience": "آماده‌سازی تجربه شما", "Building Your Visualization": "ساخت تصویرسازی",
  "Mapping Demo Regions": "نقشه‌برداری مناطق نمایشی", "Generating Your Dashboard": "ساخت داشبورد",
  "Experience Ready": "تجربه آماده است", "Open Dashboard": "باز کردن داشبورد",
  "Visual simulation only — no genetic or facial analysis is performed.": "فقط شبیه‌سازی بصری — هیچ تحلیل ژنتیکی یا چهره‌ای انجام نمی‌شود.",
  "Real DNA Results": "نتایج واقعی DNA", "Add region": "افزودن منطقه", "Normalize to 100%": "نرمال‌سازی به ۱۰۰٪",
  "View on Dashboard": "مشاهده در داشبورد", "Upload CSV / JSON": "بارگذاری CSV / JSON", "Total": "مجموع",
  "Back": "بازگشت", "Home": "خانه",
};

export function useT() {
  const { lang } = useApp();
  const t = (s: string) => (lang === "fa" ? fa[s] ?? s : s);
  const region = (r: string) => (lang === "fa" ? regionInfo(r)?.fa ?? (r === "Other Regions" ? "سایر مناطق" : r) : r);
  return { t, region, lang };
}
