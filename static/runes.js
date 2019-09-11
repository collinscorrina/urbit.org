const fs = require('fs')

const runeDir = '../content/docs/reference/hoon-expressions/rune/'

const outDir = 'runes.json'

const rune = {
  name: '',
  usage: '',
  symbol: '',
  link: '',
  desc: '',
  childRunes: []
}

const childRune = {
  name: '',
  usage: '',
  symbol: '',
  link: '',
  desc: ''
}

const writeData = (data, path) => {
  const fmtData = JSON.stringify(data, null, 2)
  fs.writeFile(path, fmtData, (err) => {
    if (err) throw err
  })
}

const getFile = (name) => {
  return fs.readFileSync(name, 'utf8')
}

// example input: "### [`! zap` (wild)](@/docs/reference/hoon-expressions/rune/zap.md)"
// example out: rune: symbol: "!", name: "zap", usage: "wild", link: "@/docs..."
const parseLine = (line) => {
  line = line.replace(/#/g,'')  // remove: #
  line = line.replace(/\[/g,'') // [
  line = line.replace(/\]/g,'') // ]
  line = line.replace(/\)/g,'') // )
  line = line.replace(/\`/g,'') // `

  // split into array for object creation
  line = line.split('(')
  line[0] = line[0].split(' ').filter(function(c){ return c !== '' })

  if(line.length > 2)
    return {
      symbol: line[0][0],
      name: line[0][1] === "==" ? "terminators" : line[0][1],
      usage: line[1],
      link: line[2]
    }
  return {}
}

// returns array of base runes object such as | alongisde its link, symbol, name and usage
const getParentRunes = () => {
  const parentDir = `${runeDir}_index.md`
  var lines = getFile(parentDir).split('\n')

  const spliceIndex = (lines) => {
    for (l in lines)
      if(lines[l].includes("Runes Proper"))
        return l
  };

  // only look at lines under the "Runes Proper" header
  lines = lines.splice(spliceIndex(lines), lines.length - spliceIndex(lines))

  // remove empty spacing lines
  lines = lines.filter(function(line){ return line !== '' })

  var data = rune
  lines = lines.map(function(line){
    // looking for line of form '[`. dot` (Nock)]...'
    if(line.includes("###"))
      data = parseLine(line)

    // line of plain text form 'Runes used for carrying out...'
    else if(!line.includes("#")){
      data.desc = line
      return data
    }
  })
  return lines
}

// returns all children runes from a given parentRune
const parseChildRune = (usage, parentRune) => {
  // get rune file, ex: bar.md
  var lines = getFile(`${runeDir}${parentRune}.md`).split('\n')

  lines = lines.map(function(line){
    // looking for line of form '### |@ "barvat"'
    if(line.includes('###') && !line.includes('####') && !line.includes("Desugaring")){

        // desc exists 2 lines below the title header
        var desc = lines[lines.indexOf(line)+2]
        if(desc.includes('#')) desc = lines[lines.indexOf(line)+4]

        // remove formatting from header line
        line = line.replace("### ", '')
        line = line.replace(/"/g, '')
        line = line.split(' ')

        // convert `line` into array of form [ '==', 'tistis' ]
        const symbol = line[0]
        const name = line[1]
        const link = `${runeDir}${parentRune}.md#${name}`
        return {
          name: name,
          usage: usage,
          symbol: symbol,
          link: link,
          desc: desc
        }
    }
  }
).filter(function(w){ return w !== undefined })
  return lines
}

const compileRunes = () => {
  var parentRunes = getParentRunes()

  // for every parent rune, get the child runes from dir/name-of-parent-rune.md
  parentRunes = Object.values(parentRunes).map(function(rune){
    if(rune !== undefined){
      // console.log(rune.name)
      rune.childRunes = parseChildRune(rune.usage, rune.name)
      return rune
    }
  }).filter(function(w){ return w !== undefined })

  writeData(parentRunes, outDir)
  console.log(`Saved rune data in ${outDir}.`)
}

// compileRunes()


const addRuneLink = () => {
  // go through each file in the folder

  fs.readdir(runeDir, (err, files) => {
  files.forEach(file => {
      if(file !== '_index.md'){
        var fileName = `${runeDir}${file}`
        // console.log(fileName)
        var lines = getFile(fileName).split('\n')

        lines = lines.map(function(line) {
          // get header lines that don't already have the {#wutcol} link syntax
          if(line.includes("###") && !line.includes("####") && !line.includes("Desugaring") && !line.includes("{")){
            // parse the header string to get the name of the rune
            var name = line
                          .replace(/\#/g,'')
                          .replace(/\"/g,'')
                          .split(' ')[2]
            // add the link to the rune header
            line = line + " " + `{#${name}}`
          }
          return line

        })
        // lines =  lines.join('\n')
        writeData(lines, runeDir+file)
      }



    });
  });
}

addRuneLink()
