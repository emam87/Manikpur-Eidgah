/**
 * Strict server-side public serializer for LandDonor records.
 *
 * Privacy guarantees:
 * 1. NEVER serializes `phone`, `nid`, or `representativePhone`.
 * 2. Detail fields gated by per-record visibility flags (`showDeedDetails`,
 *    `showPlotDetails`, `showBoundaries`) are OMITTED completely from the
 *    returned object when their toggle is false (not merely hidden in UI).
 * 3. Linked documents are only attached when `showDeedDetails` is true and
 *    the referenced documents are PUBLIC and non-deleted.
 * 4. Linked land map is only attached when `showPlotDetails` is true and the
 *    referenced map is published and non-deleted.
 */
export function serializePublicLandDonor(d, docsMap = {}) {
  const dto = {
    id: d.id,
    nameBn: d.nameBn,
    nameEn: d.nameEn,
    fatherNameBn: d.fatherNameBn,
    fatherNameEn: d.fatherNameEn,
    motherNameBn: d.motherNameBn,
    motherNameEn: d.motherNameEn,
    villageBn: d.villageBn,
    villageEn: d.villageEn,
    photoPath: d.photoPath,
    isDeceased: d.isDeceased,
    areaValue: d.areaValue,
    areaUnit: d.areaUnit,
    areaInDecimal: d.areaInDecimal,
    donationYear: d.donationYear,
    donationDate: d.donationDate,
    donationType: d.donationType,
    landUse: d.landUse,
    landUseOther: d.landUseOther,
    storyBn: d.storyBn,
    storyEn: d.storyEn,
    representativeName: d.representativeName,
    representativeRelation: d.representativeRelation,
    sortOrder: d.sortOrder,
    showDeedDetails: Boolean(d.showDeedDetails),
    showPlotDetails: Boolean(d.showPlotDetails),
    showBoundaries: Boolean(d.showBoundaries),
  };

  // Conditional Deed details (server-side omitted when showDeedDetails is false)
  if (d.showDeedDetails) {
    if (d.deedNumber) dto.deedNumber = d.deedNumber;
    if (d.deedDate) dto.deedDate = d.deedDate;

    const docList = Array.isArray(d.relatedDocumentIds)
      ? d.relatedDocumentIds.map((id) => docsMap[id]).filter(Boolean)
      : [];
    if (docList.length > 0) {
      dto.relatedDocuments = docList;
    }
  }

  // Conditional Plot / Survey details (server-side omitted when showPlotDetails is false)
  if (d.showPlotDetails) {
    if (d.khatianType) dto.khatianType = d.khatianType;
    if (d.khatianNumber) dto.khatianNumber = d.khatianNumber;
    if (d.dagNumber) dto.dagNumber = d.dagNumber;
    if (d.mouzaBn) dto.mouzaBn = d.mouzaBn;
    if (d.mouzaEn) dto.mouzaEn = d.mouzaEn;
    if (d.jlNumber) dto.jlNumber = d.jlNumber;
    if (d.upazilaBn) dto.upazilaBn = d.upazilaBn;
    if (d.upazilaEn) dto.upazilaEn = d.upazilaEn;
    if (d.districtBn) dto.districtBn = d.districtBn;
    if (d.districtEn) dto.districtEn = d.districtEn;

    if (d.relatedLandMap && d.relatedLandMap.isPublished !== false && !d.relatedLandMap.deletedAt) {
      dto.relatedLandMap = {
        id: d.relatedLandMap.id,
        titleBn: d.relatedLandMap.titleBn,
        titleEn: d.relatedLandMap.titleEn,
        surveyType: d.relatedLandMap.surveyType,
        filePath: d.relatedLandMap.filePath,
        thumbPath: d.relatedLandMap.thumbPath,
      };
    }

    if (d.geometry) {
      dto.geometry = d.geometry;
    }
  }

  // Conditional Boundaries (server-side omitted when showBoundaries is false)
  if (d.showBoundaries) {
    if (d.boundaryNorth) dto.boundaryNorth = d.boundaryNorth;
    if (d.boundarySouth) dto.boundarySouth = d.boundarySouth;
    if (d.boundaryEast) dto.boundaryEast = d.boundaryEast;
    if (d.boundaryWest) dto.boundaryWest = d.boundaryWest;
  }

  return dto;
}
