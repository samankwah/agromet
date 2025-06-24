app.get("/api/crop-calendar", (req, res) => {
  const { location, crop } = req.query;

  // Logic to get the timeline data based on location & crop
  const timelineData = {
    planting: [0, 0, 20, 50, 100, 0, 0, 0, 0, 0, 0, 0],
    sowing: [0, 0, 0, 10, 30, 80, 0, 0, 0, 0, 0, 0],
    harvesting: [0, 0, 0, 0, 0, 0, 50, 100, 80, 30, 10, 0],
  };

  res.json(timelineData);
});
