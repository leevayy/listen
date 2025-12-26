package utils

import (
	"strings"
	"unicode/utf8"
)

const maxPageSize = 250

func SplitTextToPages(text string) []string {
	text = strings.TrimSpace(text)
	var pages []string

	for len(text) > 0 {
		if utf8.RuneCountInString(text) <= maxPageSize {
			pages = append(pages, strings.TrimSpace(text))
			break
		}

		cut := cutIndex(text, maxPageSize)
		pages = append(pages, strings.TrimSpace(text[:cut]))
		text = strings.TrimSpace(text[cut:])
	}

	return pages
}

func cutIndex(text string, limit int) int {
	runeCount := 0
	lastSentenceEnd := -1
	lastSpace := -1

	for i, r := range text {
		runeCount++
		if r == '.' || r == '!' || r == '?' {
			lastSentenceEnd = i + utf8.RuneLen(r)
		}
		if r == ' ' {
			lastSpace = i
		}
		if runeCount >= limit {
			break
		}
	}

	if lastSentenceEnd != -1 {
		return lastSentenceEnd
	}
	if lastSpace != -1 {
		return lastSpace
	}

	for i := range text {
		return i
	}
	return len(text)
}
