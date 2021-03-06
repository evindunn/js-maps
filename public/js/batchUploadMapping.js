function autoMap() {
  const rows = $("tr").toArray();
  rows.forEach((row) => {
    row = $(row);
    const dbField = row.find(".dbField");
    const csvField = row.find(".csvField select");
    const csvFieldOpts = csvField.find("option").toArray();
    const normalizedDbName = dbField.text().toLowerCase().replace(/[^a-z]/g, "");

    csvFieldOpts.forEach((opt) => {
      const optNormalized = opt.value.toLowerCase().replace(/[^a-z]/g, "");
      const isLat = (
        normalizedDbName === "latitude" && optNormalized === "lat"
      );
      const isLon = (
        normalizedDbName === "longitude" && ["lon", "lng"].includes(optNormalized)
      );
      const isStateProvince = (
        normalizedDbName === "stateprovince" && optNormalized === "state"
      );

      if (isLat || isLon || isStateProvince || optNormalized === normalizedDbName) {
        csvField.val(opt.value);
      }
    });
  });
}