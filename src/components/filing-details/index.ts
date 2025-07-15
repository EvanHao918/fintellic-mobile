/**
 * Filing Details Components
 * Export all filing detail components for different filing types
 */

import Annual10KDetail from './Annual10KDetail';
import Quarterly10QDetail from './Quarterly10QDetail';
import Current8KDetail from './Current8KDetail';
import IPOS1Detail from './IPOS1Detail';
import GenericFilingDetail from './GenericFilingDetail';

// Re-export components
export { Annual10KDetail };
export { Quarterly10QDetail };
export { Current8KDetail };
export { IPOS1Detail };
export { GenericFilingDetail };

// Helper function to get the appropriate component based on filing type
export const getFilingDetailComponent = (filingType: string) => {
  const componentMap: { [key: string]: any } = {
    '10-K': Annual10KDetail,
    '10-Q': Quarterly10QDetail,
    '8-K': Current8KDetail,
    'S-1': IPOS1Detail,
  };

  return componentMap[filingType] || GenericFilingDetail;
};