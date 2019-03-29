var express = require("express");
var router = express.Router();
var fetch = require("node-fetch");
var zip = require("adm-zip");
var parser = new require("xml2js").Parser();
var fs = require("fs");
var path = require("path");
var app = express();



const fetchDataFromWorldBank = async () => {
  try {
    const data = await fetch(
      "http://api.worldbank.org/v2/en/indicator/SP.POP.TOTL?downloadformat=xml"
    );
    const zipFile = await data.buffer(); //binary file => buffer
    const openZip = new zip(zipFile);
    const zipEntries = openZip.getEntries();

    let xml = null;

    zipEntries.forEach(zipEntry => {
      console.log(zipEntry.toString());

      xml = zipEntry.getData().toString();
    });

    return new Promise((resolve, reject) => {
      parser.parseString(xml, function(err, result) {
        let records = result.Root.data[0].record;
        let slicedData = records.slice(0, 50000);
        let processedCountries = {};

        records.map(objectWithField => {
          let fields = objectWithField.field;
          let processedYear = {};

          let population;
          let year;
          let country;

          fields.map(field => {
            let fieldName = field.$.name;

            if (fieldName === "Country or Area") {
              country = field._;
            }

            if (fieldName === "Value") {
              population = field._;
            }

            if (fieldName === "Year") {
              year = field._;
            }
          });

          processedYear.year = year;
          processedYear.population = population;

          if (!processedCountries[country]) {
            processedCountries[country] = [];
          }

          processedCountries[country].push(processedYear);
        });

        if (err) {
          console.log(err);
          return reject(err);
        }

        console.log("result");
        return resolve(processedCountries);
      });
    });
  } catch (e) {
    Promise.reject(e);
  }
};

const fetchCO2FromWorldBank = async () => {
  try {
    const CO2Data = await fetch(
      "http://api.worldbank.org/v2/en/indicator/EN.ATM.CO2E.KT?downloadformat=xml"
    );

    console.log(CO2Data);
    const zipFile = await CO2Data.buffer();
    const openZip = new zip(zipFile);
    const zipEntries = openZip.getEntries();

    let xml = null;

    zipEntries.forEach(zipEntry => {
      xml = zipEntry.getData().toString();
    });

    return new Promise((resolve, reject) => {
      parser.parseString(xml, function(err, result) {
        let records = result.Root.data[0].record;
        let slicedData = records.slice(0, 1000000);
        let co2Data = {};

        slicedData.map(objectFromField => {
          let fields = objectFromField.field;
          let oneYearData = {};

          let country;
          let year;
          let emission;

          fields.map(field => {
            countryName = field.$.name;

            if (countryName === "Country or Area") {
              country = field._;
            }

            if (countryName === "Value") {
              emission = field._;
            }

            if (countryName === "Year") {
              year = field._;
            }
          });

          oneYearData.emission = emission;
          oneYearData.year = year;

          if (!co2Data[country]) {
            co2Data[country] = [];
          }

          co2Data[country].push(oneYearData);
        });

        if (err) {
          console.log(err);
          return reject(err);
        }

        console.log("result");
        return resolve(co2Data);
      });
    });
  } catch (e) {
    Promise.reject(e);
  }
};



/* GET home page. */
router.get("/", function(req, res) {
  res.render("index", { title: "Express" });
});

router.get("/api/data", function(req, res, next) {
  fetchDataFromWorldBank()
    .then(json => res.send(json))
    .catch(e => {
      console.log(e);
      res.status(500).send(e);
    });
});

router.get("/api/co2", function(req, res, next) {
  fetchCO2FromWorldBank()
    .then(json => res.send(json))
    .catch(e => {
      console.log(e);
      res.status(500).send(e);
    });
});

module.exports = router;
