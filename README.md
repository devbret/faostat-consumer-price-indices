# FAOSTAT Consumer Price Indices

!["Screenshot from the frontend, displaying PCI data for Afghanistan.](https://hosting.photobucket.com/bbcfb0d4-be20-44a0-94dc-65bff8947cf2/96038a0d-845f-4023-9908-e7a67a4e3371.png)

Explore monthly data by country and metric with this interactive data visualization of Consumer Price Indices built using React, TypeScript, Vite and D3.

## Overview

This project transforms FAOSTAT’s wide, multi-year CSV exports into a normalized long format and presents the data as a month-by-year heatmap. Allowing users to explore seasonal patterns, long-term trends and anomalies in consumer prices.

The frontend emphasizes clarity and usability, combining SVG-based rendering with a thoughtful layout. The heatmap highlights gradual shifts and sudden shocks in prices. Making it well suited for exploratory analysis of inflation data across countries and time.

When looked at as a unit, this project demonstrates a complete data visualization pipeline; from raw FAOSTAT data processing using Python, to an interactive D3 visualization. While serving as a reusable foundation for other large-scale, time-based economic datasets.

## Set Up Instructions

Below are the required software programs and instructions for installing and using this application.

### Programs Needed

- [Git](https://git-scm.com/downloads)

- [Python](https://www.python.org/downloads/)

### Steps

1. Install the above programs

2. Open a terminal

3. Clone this repository using `git` by running the following command: `git clone git@github.com:devbret/faostat-consumer-price-indices.git`

4. Navigate to the repo's directory by running: `cd faostat-consumer-price-indices`

5. Create a virtual environment with this command: `python3 -m venv venv`

6. Activate your virtual environment using: `source venv/bin/activate`

7. Install the needed dependencies for running: `pip install -r requirements.txt`

8. Download the [Consumer Price Indices](https://www.fao.org/faostat/en/#data/CP) data from FAOSTAT

9. Place the `ConsumerPricesIndices_E_All_Data.csv` file into the data directory of this repo

10. Process the data using the Python script by running the following command: `python3 app.py`

11. Open a new terminal and navigate to the internal `frontend` directory of this repo

12. Install the frontend by running: `npm install`

13. Launch the frontend by using the following command: `npm run dev`

14. Once the frontend has been opened first select an area, then an item and finally an element to view the heatmap

## Other Considerations

This project repo is intended to demonstrate an ability to do the following:

- Source interesting, relevant and publicly available data

- Use Python to transform the raw data into a useable structure

- Visualize the Python output in an interactive and engaging fashion using modern web development tools

If you have any questions or would like to collaborate, please reach out either on GitHub or via [my website](https://bretbernhoft.com/).
