# FAOSTAT Consumer Price Indices

!["Screenshot from the frontend, displaying PCI data for Afghanistan.](https://hosting.photobucket.com/bbcfb0d4-be20-44a0-94dc-65bff8947cf2/96038a0d-845f-4023-9908-e7a67a4e3371.png)

FAOSTAT CPIs is an interactive data visualization of [Consumer Price Indices](https://www.fao.org/faostat/en/#data/CP) built with React, TypeScript, Vite and D3. It transforms FAOSTAT’s wide, multi-year CSV exports into a normalized long format and presents the data as a month-by-year heatmap. Allowing users to explore seasonal patterns, long-term trends and anomalies in consumer prices.

The frontend emphasizes clarity and usability, combining SVG-based rendering with a thoughtful layout. The heatmap highlights gradual shifts and sudden shocks in prices. Making it well suited for exploratory analysis of inflation data across countries and time.

This project demonstrates a complete data visualization pipeline, from raw FAOSTAT data processing using Python, to an interactive D3 visualization. While serving as a reusable foundation for other large-scale, time-based economic datasets.
