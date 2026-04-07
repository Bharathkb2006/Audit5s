/**
 * Maps IndexedDB / upload keys to siteContent.assets fields (URL + clear *Stored).
 */
export const SITE_MEDIA_KEY_MAP = {
  logoImage: { urlField: 'logoImage', storedField: 'logoImageStored' },
  about5sVideo: { urlField: 'about5sVideo', storedField: 'about5sVideoStored' },
  s1Video: { urlField: 's1Video', storedField: 's1VideoStored' },
  s2Video: { urlField: 's2Video', storedField: 's2VideoStored' },
  s3Video: { urlField: 's3Video', storedField: 's3VideoStored' },
  s4Video: { urlField: 's4Video', storedField: 's4VideoStored' },
  s5Video: { urlField: 's5Video', storedField: 's5VideoStored' },
  s1Image: { urlField: 's1Image', storedField: 's1ImageStored' },
  s2Image: { urlField: 's2Image', storedField: 's2ImageStored' },
  s3Image: { urlField: 's3Image', storedField: 's3ImageStored' },
  s4Image: { urlField: 's4Image', storedField: 's4ImageStored' },
  s5Image: { urlField: 's5Image', storedField: 's5ImageStored' },
  organogramImage: { urlField: 'organogramImage', storedField: 'organogramImageStored' },
  barcuttingLayout: { urlField: 'barcuttingLayoutImage', storedField: 'barcuttingLayoutStored' },
  groundFloorLayout: { urlField: 'groundFloorLayoutImage', storedField: 'groundFloorLayoutStored' },
  firstFloorLayout: { urlField: 'firstFloorLayoutImage', storedField: 'firstFloorLayoutStored' },
  secondFloorLayout: { urlField: 'secondFloorLayoutImage', storedField: 'secondFloorLayoutStored' },
  summaryImage1: { urlField: 'summaryImage1', storedField: 'summaryImage1Stored' },
  summaryImage2: { urlField: 'summaryImage2', storedField: 'summaryImage2Stored' },
  summaryImage3: { urlField: 'summaryImage3', storedField: 'summaryImage3Stored' },
  bestZoneImage1: { urlField: 'bestZoneImage1', storedField: 'bestZoneImage1Stored' },
  bestZoneImage2: { urlField: 'bestZoneImage2', storedField: 'bestZoneImage2Stored' },
  worstZoneImage1: { urlField: 'worstZoneImage1', storedField: 'worstZoneImage1Stored' },
  worstZoneImage2: { urlField: 'worstZoneImage2', storedField: 'worstZoneImage2Stored' },
};

export function applyFirebaseUrlToSiteContent(prev, storageKey, url) {
  const map = SITE_MEDIA_KEY_MAP[storageKey];
  if (!map || !url) return prev;
  const base = prev && typeof prev === 'object' ? prev : {};
  const assets = { ...(base.assets || {}) };
  assets[map.urlField] = url;
  assets[map.storedField] = false;
  return { ...base, assets };
}
