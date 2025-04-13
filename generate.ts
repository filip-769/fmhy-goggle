function parseBookmarksFile(html: string) {
    return html.match(/(?<=A HREF=")[^"]+/g)?.map(url => {
        const parsedUrl = new URL(url);

        return {
            site: parsedUrl.hostname,
            pathRule: parsedUrl.pathname + parsedUrl.search === "/"
                ? ""
                : `${parsedUrl.pathname}${parsedUrl.search}^`
        }
    })
}

function parseListFile(text: string) {
    return text.split("\n")
        .map(line => line.trim())
        .filter(line => line !== "" && !line.startsWith("!"));
}

const lists = {
    all: parseBookmarksFile(
        await(await fetch(
            "https://raw.githubusercontent.com/fmhy/bookmarks/refs/heads/main/fmhy_in_bookmarks.html",
        )).text()
    ),

    starred: parseBookmarksFile(
        await(await fetch(
            "https://raw.githubusercontent.com/fmhy/bookmarks/refs/heads/main/fmhy_in_bookmarks_starred_only.html",
        )).text()
    ),

    unsafe: parseListFile(
        await(await fetch(
            "https://raw.githubusercontent.com/fmhy/FMHYFilterlist/refs/heads/main/sitelist.txt",
        )).text()
    ),

    potentiallyUnsafe: parseListFile(
        await(await fetch(
            "https://raw.githubusercontent.com/fmhy/FMHYFilterlist/refs/heads/main/sitelist-plus.txt",
        )).text()
    )
}

const header = `! name: FMHY
! description: Rerank results to boost sites on FMHY and remove unsafe sites
! public: true
! author: filip769
! homepage https://github.com/filip-769/fmhy-goggle
! issues https://github.com/filip-769/fmhy-goggle/issues`;

const goggle = [...new Set(`${header}

${lists.all?.map((link) => `${link.pathRule}$boost=4,site=${link.site}`).join("\n")}
${lists.all?.map((link) => `$boost=2,site=${link.site}`).join("\n")}
${lists.starred?.map((link) => `${link.pathRule}$boost=5,site=${link.site}`).join("\n")}
${lists.starred?.map((link) => `$boost=3,site=${link.site}`).join("\n")}
${lists.unsafe?.map((domain) => `$discard,site=${domain}`).join("\n")}
${lists.potentiallyUnsafe?.map((domain) => `$downrank=5,site=${domain}`).join("\n")}`.split("\n"))].join("\n");

Deno.writeTextFileSync("fmhy.google", goggle);

console.log("success");