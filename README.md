# radlinski.dev

This repo holds source code of [radlinski.dev](https://radlinski.dev) web page.\
Maybe at some point I will turn this website into a blog or portfolio website.

## Local development

If you'd like to clone this repo to create your own website based on this one, be my guest.

To run this project locally you'll need to:

Clone the repository:

```bash
git clone git@github.com:radlinskii/radlinski.dev.git personal-website
```

Navigate into the project directory:

```bash
cd personal-website
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The site should now be running locally at `http://localhost:4321`.

### Build framework

This project is build with [astro](https://astro.build) as a *Static Site Generator* and was created using astro's started kit.\
I've removed generated content and some of the features, like RSS feed generator, as it is not needed at the moment.

There is also `npm run astro` script that is a proxy for `astro cli`, you can use it as follows:

```bash
npm run astro -- help
```

to get more information on how to use astro.

## Deployment

This website is automatically deployed on [Cloudflare Pages](https://pages.cloudflare.com) whenever changes are pushed to the main branch.

## Contributing

This is a personal project, so I'm not actively looking for contributions.

## License

This project is licensed under the MIT License.
