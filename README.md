# FAOSTAT Consumer Price Indices

!["Screenshot from the frontend, displaying PCI data for Afghanistan.](https://hosting.photobucket.com/bbcfb0d4-be20-44a0-94dc-65bff8947cf2/aa6b1cc1-bbda-4b94-ab9a-d80752c13ed9.png)

Explore monthly data by country and metric with this interactive data visualization of Consumer Price Indices built using JavaScript and D3.

## Application Overview

Transforms FAOSTAT's multi-year CSV exports into a normalized format and presents the data as a heatmap. Allowing users to explore patterns, long-term trends and oddities in consumer prices. A playback mode moves through the dataset one country at a time.

The frontend emphasizes clarity and usability by combining SVG-based rendering with a useful layout. The heatmap highlights gradual shifts and sudden shocks in prices. Making it well suited for exploratory analysis of inflation data.

When looked at as a unit, this project demonstrates a complete data visualization pipeline, from raw FAOSTAT data processing using Python, to an interactive D3 visualization. While serving as a reusable foundation for other large-scale, time-based economic datasets.

## Basic Setup Instructions

Below are the required software programs and instructions for installing and using this application on a Linux machine.

### Programs Needed

- [Git](https://git-scm.com/downloads)

- [Python](https://www.python.org/downloads/)

### Steps

1. Install the above programs

2. Open a terminal

3. Clone this repository: `git clone git@github.com:devbret/faostat-consumer-price-indices.git`

4. Navigate to the repo's directory: `cd faostat-consumer-price-indices`

5. Create a virtual environment: `python3 -m venv venv`

6. Activate your virtual environment: `source venv/bin/activate`

7. Install the needed dependencies: `pip install -r requirements.txt`

8. Download the [Consumer Price Indices](https://www.fao.org/faostat/en/#data/CP) data from FAOSTAT

9. Place the `ConsumerPriceIndices_E_All_Data.csv` file into the `data` directory of this repo

10. Process the data: `python3 app.py`

11. Launch the frontend: `python3 -m http.server`

12. Open the app in your browser: `http://localhost:8000/`

13. When finished using the app: `CTRL + C`

14. Exit the virtual environment: `deactivate`

## Other Considerations

This project repo is intended to demonstrate an ability to do the following:

- It transforms FAOSTAT's Consumer Price Index (CPI) exports into a clean dataset using Python and pandas

- Render each country's monthly CPI history as a heatmap so patterns, inflation trends and price shocks are visible

- Playback mode automatically moves through the dataset one country at a time at adjustable speeds

- Build app with plain JavaScript, D3 and a uniform color scale which adapts to light and dark mode

If you have any questions or would like to collaborate, please reach out either on GitHub or via [my website](https://bretbernhoft.com/).
