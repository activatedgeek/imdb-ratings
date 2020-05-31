# IMDb Ratings

Extracts IMDb ratings from a public ratings list using [Playwright](https://playwright.dev).

## CSV Format

Ordered list of fields in [imdb.csv](./data/imdb.csv).

| **Field**  | **Type**  |
|---|---|
| _title_ | `str` |
| _release_year_ | `int` |
| _genre_ | `str` |
| _rating_ | `float` |
| _user_rating_ | `float` |
| _votes_ | `int` |
| _range_year_ | `str` |


## Setup

```
$ yarn
```

## Run

Update URL (optionally filename as well) in [src/index.js](./src/index.js). Then run

```
$ yarn mine
```

