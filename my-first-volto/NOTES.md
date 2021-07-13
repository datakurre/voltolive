Start Plone as Docker container

```bash
$ docker run -it --rm --name=plone -p 8080:8080 -e SITE=Plone -e ADDONS="kitconcept.volto" -e ZCML="kitconcept.volto.cors"   -e PROFILES="kitconcept.volto:default-homepage" plone
```

Yeoman is the recommended way to bootstrap a new Volto site:

```bash
$ npm init yo @plone/volto
```

Selection of quality add-ons help getting started faster:

* volto-slate:asDefault
* @kitconcept/volto-blocks-grid