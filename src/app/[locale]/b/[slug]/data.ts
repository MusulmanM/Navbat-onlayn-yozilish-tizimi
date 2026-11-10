import { cache } from "react";
import { getPublicBusinessPage } from "@/server/public-business";

// Deduplicates the query between generateMetadata, the page and the OG image.
export const loadBusiness = cache((slug: string) => getPublicBusinessPage(slug));
