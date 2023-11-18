SIZES := 16 19 38 48 128
ICONNAMES := audible muted
ICONS := $(addprefix images/, $(addsuffix .png, $(ICONNAMES)))

FILES := $(ICONS) $(shell git ls-files ':!:.gitignore' ':!:Makefile' ':!:images/' ':!:release.sh')

# inkscape >1.0 deprecates the -z (without-gui) flag and dropped
# support for the -e (export-filename) flag.
# TODO: stderr is redirected due to
# https://gitlab.com/inkscape/inbox/-/issues/3882; remove stderr
# redirection when resolved upstream.
INKSCAPE_EXPORT_FLAG := $(shell if inkscape --version 2> /dev/null | grep -qF "Inkscape 0."; then printf %s "-z -e"; else printf %s -o; fi)

.PHONY: zip
zip: out.zip

out.zip: $(FILES)
	rm -f $@
	zip -r $@ $^

# There's no good way to avoid duplicating the recipe here.
images/audible.png: images/audible.svg
	inkscape $(INKSCAPE_EXPORT_FLAG) $@ -w 128 -h 128 $<

images/muted.png: images/muted.svg
	inkscape $(INKSCAPE_EXPORT_FLAG) $@ -w 128 -h 128 $<
